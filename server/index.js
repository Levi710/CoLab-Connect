const express = require('express');
const cors = require('cors');
const db = require('./db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Razorpay = require('razorpay');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Razorpay Instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 's4g4r123'
});

app.use(cors({
    origin: [
        'https://co-lab-connect.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Initialize DB Schema
// Initialize DB Schema
async function initDb() {
    try {
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await db.query(schemaSql);

        // --- Migrations ---
        const migrations = [
            { name: 'photo_url', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT' },
            { name: 'background_url', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS background_url TEXT' },
            { name: 'messages_image_url', query: 'ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT' },
            { name: 'messages_is_edited', query: 'ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE' },
            { name: 'projects_updated_at', query: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
            { name: 'requests_status', query: "ALTER TABLE requests ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'" },
            { name: 'projects_member_limit', query: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS member_limit INTEGER DEFAULT 5' },
            { name: 'messages_project_id', query: 'ALTER TABLE messages ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id)' },
            { name: 'messages_request_id_nullable', query: 'ALTER TABLE messages ALTER COLUMN request_id DROP NOT NULL' },
            { name: 'comments_parent_id', query: 'ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE' },
            { name: 'project_members_last_read_at', query: 'ALTER TABLE project_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
            { name: 'projects_impressions', query: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0' },
            { name: 'users_password_hash_rename', query: 'ALTER TABLE users RENAME COLUMN password TO password_hash' },
            { name: 'users_public_id', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS public_id VARCHAR(50) UNIQUE' },
            { name: 'users_profile_views', query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0' },
            { name: 'notifications_from_user_id', query: 'ALTER TABLE notifications ADD COLUMN IF NOT EXISTS from_user_id INTEGER REFERENCES users(id)' }
        ];

        for (const migration of migrations) {
            try {
                await db.query(migration.query);
                console.log(`Checked/Applied migration: ${migration.name}`);
            } catch (e) {
                console.log(`Migration note (${migration.name}):`, e.message);
            }
        }

        // Backfill public_id for existing users
        try {
            const { rows: usersWithoutPublicId } = await db.query("SELECT id FROM users WHERE public_id IS NULL");
            if (usersWithoutPublicId.length > 0) {
                console.log(`Backfilling public_id for ${usersWithoutPublicId.length} users...`);
                const crypto = require('crypto');
                for (const user of usersWithoutPublicId) {
                    const uuid = crypto.randomUUID();
                    await db.query("UPDATE users SET public_id = $1 WHERE id = $2", [uuid, user.id]);
                }
                console.log('Backfill complete.');
            }
        } catch (e) {
            console.error('Error backfilling public_id:', e);
        }

        // Create tables if not exist
        const tables = [
            `CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                request_id INTEGER REFERENCES requests(id),
                sender_id INTEGER REFERENCES users(id),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                image_url TEXT,
                is_edited BOOLEAN DEFAULT FALSE,
                project_id INTEGER REFERENCES projects(id)
            )`,
            `CREATE TABLE IF NOT EXISTS project_members (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id),
                user_id INTEGER REFERENCES users(id),
                role VARCHAR(100) DEFAULT 'Member',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(project_id, user_id)
            )`,
            `CREATE TABLE IF NOT EXISTS project_images (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                image_url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                type VARCHAR(50),
                content TEXT NOT NULL,
                related_id INTEGER,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS likes (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(project_id, user_id)
            )`,
            `CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS comment_likes (
                comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (comment_id, user_id)
            )`
        ];

        for (const tableQuery of tables) {
            try {
                await db.query(tableQuery);
                console.log('Checked/Created table');
            } catch (e) {
                console.log('Table creation note:', e.message);
            }
        }

        // Backfill owners
        try {
            await db.query(`
                INSERT INTO project_members (project_id, user_id, role)
                SELECT p.id, p.user_id, 'Owner'
                FROM projects p
                WHERE NOT EXISTS (
                    SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = p.user_id
                )
            `);
            console.log('Checked/Backfilled project owners');
        } catch (e) { console.log('Migration note:', e.message); }

        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS creators (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    role VARCHAR(100) NOT NULL,
                    bio TEXT,
                    image_url TEXT,
                    display_order INTEGER DEFAULT 0
                )
            `);

            // Seed initial creators if empty
            const creatorsCount = await db.query('SELECT COUNT(*) FROM creators');
            if (parseInt(creatorsCount.rows[0].count) === 0) {
                await db.query(`
                    INSERT INTO creators (name, role, bio, image_url, display_order) VALUES
                    ('Ayush Kishor (Levi)', 'Founder & Lead Developer', 'The visionary behind CoLab Connect. Passionate about building tools that empower creators.', 'https://github.com/Levi710.png', 1),
                    ('Sarah Chen', 'Product Designer', 'Crafting intuitive and beautiful user experiences. Believes in design as a problem-solving tool.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', 2),
                    ('Marcus Johnson', 'Community Manager', 'Building bridges between developers and designers. Here to help you find your dream team.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', 3)
                `);
                console.log('Seeded creators table');
            }
        } catch (e) { console.log('Creators table error:', e.message); }

        console.log('Database initialized');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

setTimeout(initDb, 5000);

// Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Password Complexity Validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSymbol) {
        return res.status(400).json({ error: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.' });
    }

    try {
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const publicId = crypto.randomUUID(); // Generate UUID

        const newUser = await db.query(
            'INSERT INTO users (username, email, password_hash, public_id) VALUES ($1, $2, $3, $4) RETURNING id, public_id, username, email, is_premium',
            [username, email, hashedPassword, publicId]
        );

        const token = jwt.sign({ id: newUser.rows[0].id, email: newUser.rows[0].email }, JWT_SECRET);
        res.json({ token, user: newUser.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`[DEBUG] Login attempt for email: ${email}`);
    try {
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            console.log('[DEBUG] User not found');
            return res.status(400).json({ error: 'User not found' });
        }

        const user = userRes.rows[0];
        console.log(`[DEBUG] User found: ${user.username}`);

        const validPassword = await bcrypt.compare(password, user.password_hash);
        console.log(`[DEBUG] Password valid: ${validPassword}`);

        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

        // Return public_id and other safe fields
        const { password_hash, ...safeUser } = user;
        res.json({ token, user: safeUser });
    } catch (err) {
        console.error('[DEBUG] Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const userRes = await db.query('SELECT id, public_id, username, email, bio, skills, photo_url, background_url, is_premium, profile_views FROM users WHERE id = $1', [req.user.id]);
        res.json(userRes.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});



// Middleware for optional authentication
const optionalAuthenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        req.user = null;
        return next();
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
};

app.get('/api/projects', optionalAuthenticateToken, async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const result = await db.query(`
            SELECT p.*, u.username as owner_name, u.photo_url as owner_photo, u.public_id as owner_public_id,
            (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
            (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) as comments_count,
            (SELECT json_agg(pi.image_url) FROM project_images pi WHERE pi.project_id = p.id) as images,
            (SELECT COUNT(*)::int FROM likes l WHERE l.project_id = p.id) as likes_count,
            CASE WHEN $1::int IS NOT NULL THEN (SELECT COUNT(*) > 0 FROM likes l WHERE l.project_id = p.id AND l.user_id = $1) ELSE FALSE END as is_liked
            FROM projects p 
            JOIN users u ON p.user_id = u.id
            ORDER BY created_at DESC
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.get('/api/projects/my', authenticateToken, async (req, res) => {
    console.log(`[DEBUG] Fetching projects for user ID: ${req.user.id}`);
    try {
        const result = await db.query(`
            SELECT p.*, u.username as owner_name, u.photo_url as owner_photo, u.public_id as owner_public_id,
            (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
            (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) as comments_count,
            (SELECT json_agg(pi.image_url) FROM project_images pi WHERE pi.project_id = p.id) as images,
            (SELECT COUNT(*)::int FROM likes l WHERE l.project_id = p.id) as likes_count,
            (SELECT COUNT(*) > 0 FROM likes l WHERE l.project_id = p.id AND l.user_id = $1) as is_liked
            FROM projects p 
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = $1
            ORDER BY created_at DESC
        `, [req.user.id]);
        console.log(`[DEBUG] Found ${result.rows.length} projects`);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch my projects' });
    }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
    const { title, description, category, status, lookingFor, pollQuestion, memberLimit, images } = req.body;
    try {
        const limit = parseInt(memberLimit) || 5;
        const result = await db.query(
            'INSERT INTO projects (user_id, title, description, category, status, looking_for, poll_question, member_limit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [req.user.id, title, description, category, status, lookingFor, pollQuestion, limit]
        );
        const project = result.rows[0];

        // Add creator as a member
        await db.query(
            'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
            [project.id, req.user.id, 'Owner']
        );

        // Handle Images
        if (images && Array.isArray(images) && images.length > 0) {
            const userRes = await db.query('SELECT is_premium FROM users WHERE id = $1', [req.user.id]);
            const isPremium = userRes.rows[0].is_premium;
            const imageLimit = isPremium ? 10 : 5;

            const imagesToInsert = images.slice(0, imageLimit);
            for (const imgUrl of imagesToInsert) {
                await db.query('INSERT INTO project_images (project_id, image_url) VALUES ($1, $2)', [project.id, imgUrl]);
            }
        }

        res.json(project);
    } catch (err) {
        console.error('Failed to create project:', err);
        res.status(500).json({ error: 'Failed to create project', details: err.message });
    }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
    const { title, description, category, status, lookingFor, pollQuestion, memberLimit } = req.body;
    const projectId = req.params.id;
    try {
        const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
        const project = projectRes.rows[0];
        if (project.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        const userRes = await db.query('SELECT is_premium FROM users WHERE id = $1', [req.user.id]);
        const isPremium = userRes.rows[0].is_premium;
        if (!isPremium) {
            const createdAt = new Date(project.created_at);
            const now = new Date();
            const diffMinutes = (now - createdAt) / 1000 / 60;
            if (diffMinutes > 30) return res.status(403).json({ error: 'Edit time limit exceeded (30 mins). Upgrade to Premium.' });
        }

        const result = await db.query(
            'UPDATE projects SET title = $1, description = $2, category = $3, status = $4, looking_for = $5, poll_question = $6, member_limit = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
            [title, description, category, status, lookingFor, pollQuestion, memberLimit, projectId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Toggle Project Like
app.post('/api/projects/:id/like', authenticateToken, async (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.id;
    try {
        const check = await db.query('SELECT * FROM likes WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
        if (check.rows.length > 0) {
            await db.query('DELETE FROM likes WHERE project_id = $1 AND user_id = $2', [projectId, userId]);

            // Remove notification if it exists (Debounce/Undo strategy)
            await db.query('DELETE FROM notifications WHERE type = \'project_like\' AND related_id = $1 AND from_user_id = $2', [projectId, userId]);

            const countRes = await db.query('SELECT COUNT(*) FROM likes WHERE project_id = $1', [projectId]);
            res.json({ liked: false, likes: parseInt(countRes.rows[0].count) });
        } else {
            await db.query('INSERT INTO likes (project_id, user_id) VALUES ($1, $2)', [projectId, userId]);

            // Send Notification to Project Owner
            const projectRes = await db.query('SELECT user_id, title FROM projects WHERE id = $1', [projectId]);
            const ownerId = projectRes.rows[0].user_id;

            if (ownerId !== userId) { // Don't notify if liking own project
                const userRes = await db.query('SELECT username FROM users WHERE id = $1', [userId]);
                const likerName = userRes.rows[0].username;

                await db.query(
                    'INSERT INTO notifications (user_id, type, content, related_id, from_user_id) VALUES ($1, $2, $3, $4, $5)',
                    [ownerId, 'project_like', `${likerName} liked your project "${projectRes.rows[0].title}"`, projectId, userId]
                );
            }

            const countRes = await db.query('SELECT COUNT(*) FROM likes WHERE project_id = $1', [projectId]);
            res.json({ liked: true, likes: parseInt(countRes.rows[0].count) });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
});

app.post('/api/comments/:id/like', authenticateToken, async (req, res) => {
    const commentId = req.params.id;
    const userId = req.user.id;
    try {
        const check = await db.query('SELECT * FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, userId]);
        if (check.rows.length > 0) {
            await db.query('DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, userId]);
            const countRes = await db.query('SELECT COUNT(*) FROM comment_likes WHERE comment_id = $1', [commentId]);
            res.json({ liked: false, likes: parseInt(countRes.rows[0].count) });
        } else {
            await db.query('INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)', [commentId, userId]);
            const countRes = await db.query('SELECT COUNT(*) FROM comment_likes WHERE comment_id = $1', [commentId]);
            res.json({ liked: true, likes: parseInt(countRes.rows[0].count) });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle comment like' });
    }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    const projectId = req.params.id;
    try {
        const projectRes = await db.query('SELECT user_id FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
        if (projectRes.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        // Cascade delete handled by DB constraints mostly, but manual cleanup for safety
        await db.query('DELETE FROM project_images WHERE project_id = $1', [projectId]);
        await db.query('DELETE FROM project_members WHERE project_id = $1', [projectId]);
        await db.query('DELETE FROM requests WHERE project_id = $1', [projectId]);
        await db.query('DELETE FROM likes WHERE project_id = $1', [projectId]);
        await db.query('DELETE FROM comments WHERE project_id = $1', [projectId]);
        await db.query('DELETE FROM messages WHERE project_id = $1', [projectId]);
        await db.query('DELETE FROM projects WHERE id = $1', [projectId]);

        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error('Failed to delete project:', err);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

app.post('/api/projects/:id/view', async (req, res) => {
    const projectId = req.params.id;
    try {
        await db.query('UPDATE projects SET impressions = COALESCE(impressions, 0) + 1 WHERE id = $1', [projectId]);
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to increment impressions:', err);
        res.status(500).json({ error: 'Failed to update view count' });
    }
});

app.get('/api/projects/:id/comments', async (req, res) => {
    const projectId = req.params.id;
    try {
        const result = await db.query(`
            SELECT c.*, u.username, u.photo_url,
            (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.project_id = $1
            ORDER BY c.created_at DESC
            `, [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

app.post('/api/projects/:id/comments', authenticateToken, async (req, res) => {
    const projectId = req.params.id;
    const { content, parentId } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) return res.status(400).json({ error: 'Comment content is required' });

    try {
        if (parentId) {
            const parentCheck = await db.query('SELECT id, project_id FROM comments WHERE id = $1', [parentId]);
            if (parentCheck.rows.length === 0) return res.status(404).json({ error: 'Parent comment not found' });
            if (parentCheck.rows[0].project_id != projectId) return res.status(400).json({ error: 'Parent comment mismatch' });
        }

        const result = await db.query(`
            INSERT INTO comments(project_id, user_id, content, parent_id)
        VALUES($1, $2, $3, $4)
        RETURNING *
            `, [projectId, userId, content, parentId || null]);

        const newComment = result.rows[0];
        const userRes = await db.query('SELECT username, photo_url FROM users WHERE id = $1', [userId]);
        newComment.username = userRes.rows[0].username;
        newComment.photo_url = userRes.rows[0].photo_url;

        res.json(newComment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// --- Request Routes ---
app.post('/api/requests', authenticateToken, async (req, res) => {
    const { projectId, role, note } = req.body;
    try {
        const projectRes = await db.query('SELECT user_id FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
        if (projectRes.rows[0].user_id === req.user.id) return res.status(400).json({ error: 'Cannot apply to your own project' });

        const memberCheck = await db.query('SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (memberCheck.rows.length > 0) return res.status(400).json({ error: 'You are already a member of this project' });

        const existing = await db.query('SELECT * FROM requests WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'You have already requested to join this project' });

        const result = await db.query(
            'INSERT INTO requests (project_id, user_id, role, note, status) VALUES ($1, $2, $3, $4, \'pending\') RETURNING *',
            [projectId, req.user.id, role, note]
        );

        // Send Notification to Project Owner
        const ownerId = projectRes.rows[0].user_id;
        const userRes = await db.query('SELECT username FROM users WHERE id = $1', [req.user.id]);
        const requesterName = userRes.rows[0].username;
        const projectTitle = await db.query('SELECT title FROM projects WHERE id = $1', [projectId]);

        await db.query(
            'INSERT INTO notifications (user_id, type, content, related_id, from_user_id) VALUES ($1, $2, $3, $4, $5)',
            [ownerId, 'new_request', `${requesterName} wants to join "${projectTitle.rows[0].title}"`, result.rows[0].id, req.user.id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error sending request:', err);
        res.status(500).json({ error: 'Failed to send request' });
    }
});

app.get('/api/requests/my-projects', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT r.*, p.title as project_title, u.username as user_name
            FROM requests r
            JOIN projects p ON r.project_id = p.id
            JOIN users u ON r.user_id = u.id
            WHERE p.user_id = $1
            ORDER BY r.created_at DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

app.delete('/api/requests/:id', authenticateToken, async (req, res) => {
    const requestId = req.params.id;
    try {
        const requestRes = await db.query('SELECT * FROM requests WHERE id = $1', [requestId]);
        const request = requestRes.rows[0];
        if (!request) return res.status(404).json({ error: 'Request not found' });

        const projectRes = await db.query('SELECT user_id FROM projects WHERE id = $1', [request.project_id]);
        if (request.user_id !== req.user.id && projectRes.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await db.query('DELETE FROM requests WHERE id = $1', [requestId]);
        res.json({ message: 'Request deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete request' });
    }
});

app.put('/api/requests/:id/status', authenticateToken, async (req, res) => {
    const { status } = req.body;
    const requestId = req.params.id;
    try {
        const requestRes = await db.query('SELECT * FROM requests WHERE id = $1', [requestId]);
        const request = requestRes.rows[0];
        if (!request) return res.status(404).json({ error: 'Request not found' });

        const projectRes = await db.query('SELECT user_id, member_limit, title FROM projects WHERE id = $1', [request.project_id]);
        if (projectRes.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        // Prevent duplicate updates
        if (request.status === status) {
            return res.json(request);
        }

        if (status === 'accepted') {
            const membersRes = await db.query('SELECT COUNT(*) FROM project_members WHERE project_id = $1', [request.project_id]);
            const memberCount = parseInt(membersRes.rows[0].count);
            if (memberCount >= projectRes.rows[0].member_limit) return res.status(400).json({ error: 'Project is full' });

            await db.query(
                'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO NOTHING',
                [request.project_id, request.user_id, request.role]
            );
        }

        const result = await db.query('UPDATE requests SET status = $1 WHERE id = $2 RETURNING *', [status, requestId]);
        await db.query(
            'INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, $2, $3, $4)',
            [request.user_id, 'request_' + status, `Your request to join ${projectRes.rows[0].title} was ${status} `, request.project_id]
        );

        // Send System Message to Project Chat
        if (status === 'accepted') {
            const systemContent = `System: ${request.user_name || 'A new member'} has joined the project.`;
            await db.query(
                'INSERT INTO messages (project_id, sender_id, content) VALUES ($1, $2, $3)',
                [request.project_id, null, systemContent] // sender_id null for system
            );
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update request status' });
    }
});

// --- Chat / Room Routes ---
app.get('/api/chat/rooms', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, pm.role as my_role,
            (SELECT COUNT(*) FROM messages m WHERE m.project_id = p.id AND m.created_at > pm.last_read_at) as unread_count
            FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = $1
            ORDER BY p.created_at DESC
    `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch chat rooms' });
    }
});

app.get('/api/messages/project/:projectId', authenticateToken, async (req, res) => {
    const projectId = req.params.projectId;
    try {
        const memberCheck = await db.query('SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Not a member of this project' });

        // Update last_read_at
        await db.query('UPDATE project_members SET last_read_at = CURRENT_TIMESTAMP WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);

        const result = await db.query(`
            SELECT m.*, u.username as sender_name, u.photo_url as sender_photo
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            JOIN project_members pm ON pm.project_id = m.project_id AND pm.user_id = $2
            WHERE m.project_id = $1 AND m.created_at >= pm.joined_at
            ORDER BY m.created_at ASC
    `, [projectId, req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    const { projectId, content, image_url } = req.body;
    try {
        const memberCheck = await db.query('SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Not a member of this project' });

        if (image_url) {
            const userRes = await db.query('SELECT is_premium FROM users WHERE id = $1', [req.user.id]);
            if (!userRes.rows[0].is_premium) return res.status(403).json({ error: 'Image sending is a Premium feature' });
        }

        const result = await db.query(
            'INSERT INTO messages (project_id, sender_id, content, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [projectId, req.user.id, content, image_url]
        );
        const senderRes = await db.query('SELECT username, photo_url FROM users WHERE id = $1', [req.user.id]);
        const message = { ...result.rows[0], sender_name: senderRes.rows[0].username, sender_photo: senderRes.rows[0].photo_url };
        res.json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// --- User Profile Routes ---
app.get('/api/users/:id/profile', optionalAuthenticateToken, async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user ? req.user.id : null;
    console.log(`[DEBUG] Fetching profile for ID: ${id} `);
    try {
        let userRes;
        // Check if id is UUID (public_id) or Integer (id)
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
        console.log(`[DEBUG] Is UUID: ${isUuid} `);

        if (isUuid) {
            userRes = await db.query('SELECT id, public_id, username, email, bio, skills, photo_url, background_url, is_premium, profile_views FROM users WHERE public_id = $1', [id]);
        } else {
            // Fallback for integer IDs (though frontend should use public_id)
            userRes = await db.query('SELECT id, public_id, username, email, bio, skills, photo_url, background_url, is_premium, profile_views FROM users WHERE id = $1', [id]);
        }

        if (userRes.rows.length === 0) {
            console.log('[DEBUG] User not found in DB');
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userRes.rows[0];

        // Increment profile views
        await db.query('UPDATE users SET profile_views = profile_views + 1 WHERE id = $1', [user.id]);
        user.profile_views = (user.profile_views || 0) + 1;

        // Fetch user's projects
        const projectsRes = await db.query(`
            SELECT p.*,
            (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
            (SELECT COUNT(*)::int FROM likes l WHERE l.project_id = p.id) as likes_count,
            CASE WHEN $2::int IS NOT NULL THEN (SELECT COUNT(*) > 0 FROM likes l WHERE l.project_id = p.id AND l.user_id = $2) ELSE FALSE END as is_liked
            FROM projects p 
            WHERE p.user_id = $1 
            ORDER BY p.created_at DESC
        `, [user.id, currentUserId]);

        const projectsWithUser = projectsRes.rows.map(p => ({
            ...p,
            owner_name: user.username,
            owner_photo: user.photo_url,
            owner_public_id: user.public_id
        }));

        res.json({ ...user, projects: projectsWithUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.delete('/api/users/me', authenticateToken, async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const userId = req.user.id;

        // 1. Delete Notifications
        await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);

        // 2. Delete Messages sent by user
        await client.query('DELETE FROM messages WHERE sender_id = $1', [userId]);

        // 3. Delete Project Memberships
        await client.query('DELETE FROM project_members WHERE user_id = $1', [userId]);

        // 4. Delete Requests made by user
        await client.query('DELETE FROM requests WHERE user_id = $1', [userId]);

        // 5. Handle Owned Projects
        const projectsRes = await client.query('SELECT id FROM projects WHERE user_id = $1', [userId]);
        const projectIds = projectsRes.rows.map(p => p.id);

        if (projectIds.length > 0) {
            // Delete messages in these projects
            await client.query('DELETE FROM messages WHERE project_id = ANY($1)', [projectIds]);
            // Delete members in these projects
            await client.query('DELETE FROM project_members WHERE project_id = ANY($1)', [projectIds]);
            // Delete requests for these projects
            await client.query('DELETE FROM requests WHERE project_id = ANY($1)', [projectIds]);
            // Delete the projects
            await client.query('DELETE FROM projects WHERE user_id = $1', [userId]);
        }

        // 6. Delete User
        await client.query('DELETE FROM users WHERE id = $1', [userId]);

        await client.query('COMMIT');
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to delete account' });
    } finally {
        client.release();
    }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
    const { bio, skills, photo_url, background_url } = req.body;
    try {
        const result = await db.query(
            'UPDATE users SET bio = $1, skills = $2, photo_url = $3, background_url = $4 WHERE id = $5 RETURNING id, public_id, username, email, bio, skills, photo_url, background_url, is_premium',
            [bio, skills, photo_url, background_url, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.put('/api/messages/:id', authenticateToken, async (req, res) => {
    const { content } = req.body;
    const messageId = req.params.id;
    try {
        const msgRes = await db.query('SELECT * FROM messages WHERE id = $1', [messageId]);
        if (msgRes.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
        const message = msgRes.rows[0];
        if (message.sender_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        const createdAt = new Date(message.created_at);
        const now = new Date();
        const diffMinutes = (now - createdAt) / 1000 / 60;
        if (diffMinutes > 10) return res.status(403).json({ error: 'Edit time limit exceeded (10 mins)' });

        const result = await db.query('UPDATE messages SET content = $1, is_edited = TRUE WHERE id = $2 RETURNING *', [content, messageId]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update message' });
    }
});

app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
    const messageId = req.params.id;
    try {
        const msgRes = await db.query('SELECT * FROM messages WHERE id = $1', [messageId]);
        if (msgRes.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
        const message = msgRes.rows[0];

        if (message.sender_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        const createdAt = new Date(message.created_at);
        const now = new Date();
        const diffMinutes = (now - createdAt) / 1000 / 60;
        if (diffMinutes > 10) return res.status(403).json({ error: 'Delete time limit exceeded (10 mins)' });

        await db.query('DELETE FROM messages WHERE id = $1', [messageId]);
        res.json({ message: 'Message deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});



// --- Read Receipts Route ---
app.get('/api/messages/:id/read-receipts', authenticateToken, async (req, res) => {
    const messageId = req.params.id;
    try {
        // Check if user is member of the project
        const msgRes = await db.query('SELECT project_id FROM messages WHERE id = $1', [messageId]);
        if (msgRes.rows.length === 0) return res.status(404).json({ error: 'Message not found' });

        const projectId = msgRes.rows[0].project_id;
        const memberCheck = await db.query('SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Unauthorized' });

        const result = await db.query(`
            SELECT u.id, u.username, u.photo_url, pm.last_read_at as read_at
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = $1 
            AND pm.last_read_at >= (SELECT created_at FROM messages WHERE id = $2)
            AND pm.user_id != (SELECT sender_id FROM messages WHERE id = $2)
`, [projectId, messageId]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch read receipts' });
    }
});

// --- Member Routes ---
app.get('/api/projects/:projectId/members', authenticateToken, async (req, res) => {
    const projectId = req.params.projectId;
    try {
        const result = await db.query(`
            SELECT pm.*, u.username, u.photo_url, u.email
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = $1
    `, [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching members:', err);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

app.delete('/api/projects/:projectId/members/:userId', authenticateToken, async (req, res) => {
    const { projectId, userId } = req.params;
    try {
        const projectRes = await db.query('SELECT user_id, title FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Only project owner can remove members' });
        if (parseInt(userId) === req.user.id) return res.status(400).json({ error: 'Cannot remove yourself' });

        await db.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);

        // Send Notification to removed member
        await db.query(
            'INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, $2, $3, $4)',
            [userId, 'project_kicked', `You have been removed from the project "${projectRes.rows[0].title}"`, projectId]
        );

        res.json({ message: 'Member removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// --- Chat / Room Routes ---
app.get('/api/chat/rooms', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, pm.role as my_role,
    (SELECT COUNT(*) FROM messages m WHERE m.project_id = p.id AND m.created_at > pm.last_read_at) as unread_count
            FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = $1
            ORDER BY p.created_at DESC
    `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch chat rooms' });
    }
});

app.get('/api/messages/project/:projectId', authenticateToken, async (req, res) => {
    const projectId = req.params.projectId;
    try {
        const memberCheck = await db.query('SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Not a member of this project' });

        // Update last_read_at
        await db.query('UPDATE project_members SET last_read_at = CURRENT_TIMESTAMP WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);

        const result = await db.query(`
            SELECT m.*, u.username as sender_name, u.photo_url as sender_photo, u.public_id as sender_public_id
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            JOIN project_members pm ON pm.project_id = m.project_id AND pm.user_id = $2
            WHERE m.project_id = $1 AND m.created_at >= pm.joined_at
            ORDER BY m.created_at ASC
    `, [projectId, req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    const { projectId, content, image_url } = req.body;
    try {
        const memberCheck = await db.query('SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Not a member of this project' });

        if (image_url) {
            const userRes = await db.query('SELECT is_premium FROM users WHERE id = $1', [req.user.id]);
            if (!userRes.rows[0].is_premium) return res.status(403).json({ error: 'Image sending is a Premium feature' });
        }

        const result = await db.query(
            'INSERT INTO messages (project_id, sender_id, content, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [projectId, req.user.id, content, image_url]
        );
        const senderRes = await db.query('SELECT username, photo_url, public_id FROM users WHERE id = $1', [req.user.id]);
        const message = {
            ...result.rows[0],
            sender_name: senderRes.rows[0].username,
            sender_photo: senderRes.rows[0].photo_url,
            sender_public_id: senderRes.rows[0].public_id
        };
        res.json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.put('/api/messages/:id', authenticateToken, async (req, res) => {
    const { content } = req.body;
    const messageId = req.params.id;
    try {
        const msgRes = await db.query('SELECT * FROM messages WHERE id = $1', [messageId]);
        if (msgRes.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
        const message = msgRes.rows[0];
        if (message.sender_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        const createdAt = new Date(message.created_at);
        const now = new Date();
        const diffMinutes = (now - createdAt) / 1000 / 60;
        if (diffMinutes > 10) return res.status(403).json({ error: 'Edit time limit exceeded (10 mins)' });

        const result = await db.query('UPDATE messages SET content = $1, is_edited = TRUE WHERE id = $2 RETURNING *', [content, messageId]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update message' });
    }
});

app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
    const messageId = req.params.id;
    try {
        const msgRes = await db.query('SELECT * FROM messages WHERE id = $1', [messageId]);
        if (msgRes.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
        const message = msgRes.rows[0];

        if (message.sender_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        const createdAt = new Date(message.created_at);
        const now = new Date();
        const diffMinutes = (now - createdAt) / 1000 / 60;
        if (diffMinutes > 10) return res.status(403).json({ error: 'Delete time limit exceeded (10 mins)' });

        await db.query('DELETE FROM messages WHERE id = $1', [messageId]);
        res.json({ message: 'Message deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});



// --- Read Receipts Route ---
app.get('/api/messages/:id/read-receipts', authenticateToken, async (req, res) => {
    const messageId = req.params.id;
    try {
        // Check if user is member of the project
        const msgRes = await db.query('SELECT project_id FROM messages WHERE id = $1', [messageId]);
        if (msgRes.rows.length === 0) return res.status(404).json({ error: 'Message not found' });

        const projectId = msgRes.rows[0].project_id;
        const memberCheck = await db.query('SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Unauthorized' });

        const result = await db.query(`
            SELECT u.id, u.username, u.photo_url, pm.last_read_at as read_at
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = $1 
            AND pm.last_read_at >= (SELECT created_at FROM messages WHERE id = $2)
            AND pm.user_id != (SELECT sender_id FROM messages WHERE id = $2)
`, [projectId, messageId]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch read receipts' });
    }
});

// --- Member Routes ---
app.get('/api/projects/:projectId/members', authenticateToken, async (req, res) => {
    const projectId = req.params.projectId;
    try {
        const result = await db.query(`
            SELECT pm.*, u.username, u.photo_url, u.email
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = $1
    `, [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching members:', err);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

app.delete('/api/projects/:projectId/members/:userId', authenticateToken, async (req, res) => {
    const { projectId, userId } = req.params;
    try {
        const projectRes = await db.query('SELECT user_id, title FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Only project owner can remove members' });
        if (parseInt(userId) === req.user.id) return res.status(400).json({ error: 'Cannot remove yourself' });

        await db.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);

        // Send Notification to removed member
        await db.query(
            'INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, $2, $3, $4)',
            [userId, 'project_kicked', `You have been removed from the project "${projectRes.rows[0].title}"`, projectId]
        );

        res.json({ message: 'Member removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});


// Creators API
app.get('/api/creators', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM creators ORDER BY display_order ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch creators' });
    }
});

// --- Chat / Room Routes ---
app.get('/api/chat/rooms', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, pm.role as my_role,
    (SELECT COUNT(*) FROM messages m WHERE m.project_id = p.id AND m.created_at > pm.last_read_at) as unread_count
            FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = $1
            ORDER BY p.created_at DESC
    `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch chat rooms' });
    }
});

app.get('/api/messages/project/:projectId', authenticateToken, async (req, res) => {
    const projectId = req.params.projectId;
    try {
        const memberCheck = await db.query('SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Not a member of this project' });

        // Update last_read_at
        await db.query('UPDATE project_members SET last_read_at = CURRENT_TIMESTAMP WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);

        const result = await db.query(`
            SELECT m.*, u.username as sender_name, u.photo_url as sender_photo, u.public_id as sender_public_id
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            JOIN project_members pm ON pm.project_id = m.project_id AND pm.user_id = $2
            WHERE m.project_id = $1 AND m.created_at >= pm.joined_at
            ORDER BY m.created_at ASC
    `, [projectId, req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    const { projectId, content, image_url } = req.body;
    try {
        const memberCheck = await db.query('SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Not a member of this project' });

        if (image_url) {
            const userRes = await db.query('SELECT is_premium FROM users WHERE id = $1', [req.user.id]);
            if (!userRes.rows[0].is_premium) return res.status(403).json({ error: 'Image sending is a Premium feature' });
        }

        const result = await db.query(
            'INSERT INTO messages (project_id, sender_id, content, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [projectId, req.user.id, content, image_url]
        );
        const senderRes = await db.query('SELECT username, photo_url, public_id FROM users WHERE id = $1', [req.user.id]);
        const message = {
            ...result.rows[0],
            sender_name: senderRes.rows[0].username,
            sender_photo: senderRes.rows[0].photo_url,
            sender_public_id: senderRes.rows[0].public_id
        };
        res.json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.put('/api/messages/:id', authenticateToken, async (req, res) => {
    const { content } = req.body;
    const messageId = req.params.id;
    try {
        const msgRes = await db.query('SELECT * FROM messages WHERE id = $1', [messageId]);
        if (msgRes.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
        const message = msgRes.rows[0];
        if (message.sender_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        const createdAt = new Date(message.created_at);
        const now = new Date();
        const diffMinutes = (now - createdAt) / 1000 / 60;
        if (diffMinutes > 10) return res.status(403).json({ error: 'Edit time limit exceeded (10 mins)' });

        const result = await db.query('UPDATE messages SET content = $1, is_edited = TRUE WHERE id = $2 RETURNING *', [content, messageId]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update message' });
    }
});

app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
    const messageId = req.params.id;
    try {
        const msgRes = await db.query('SELECT * FROM messages WHERE id = $1', [messageId]);
        if (msgRes.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
        const message = msgRes.rows[0];

        if (message.sender_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        const createdAt = new Date(message.created_at);
        const now = new Date();
        const diffMinutes = (now - createdAt) / 1000 / 60;
        if (diffMinutes > 10) return res.status(403).json({ error: 'Delete time limit exceeded (10 mins)' });

        await db.query('DELETE FROM messages WHERE id = $1', [messageId]);
        res.json({ message: 'Message deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});



// --- Read Receipts Route ---
app.get('/api/messages/:id/read-receipts', authenticateToken, async (req, res) => {
    const messageId = req.params.id;
    try {
        // Check if user is member of the project
        const msgRes = await db.query('SELECT project_id FROM messages WHERE id = $1', [messageId]);
        if (msgRes.rows.length === 0) return res.status(404).json({ error: 'Message not found' });

        const projectId = msgRes.rows[0].project_id;
        const memberCheck = await db.query('SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Unauthorized' });

        const result = await db.query(`
            SELECT u.id, u.username, u.photo_url, pm.last_read_at as read_at
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = $1 
            AND pm.last_read_at >= (SELECT created_at FROM messages WHERE id = $2)
            AND pm.user_id != (SELECT sender_id FROM messages WHERE id = $2)
`, [projectId, messageId]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch read receipts' });
    }
});

// --- Member Routes ---
app.get('/api/projects/:projectId/members', authenticateToken, async (req, res) => {
    const projectId = req.params.projectId;
    try {
        const result = await db.query(`
            SELECT pm.*, u.username, u.photo_url, u.email
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = $1
    `, [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching members:', err);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

app.delete('/api/projects/:projectId/members/:userId', authenticateToken, async (req, res) => {
    const { projectId, userId } = req.params;
    try {
        const projectRes = await db.query('SELECT user_id, title FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Only project owner can remove members' });
        if (parseInt(userId) === req.user.id) return res.status(400).json({ error: 'Cannot remove yourself' });

        await db.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);

        // Send Notification to removed member
        await db.query(
            'INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, $2, $3, $4)',
            [userId, 'project_kicked', `You have been removed from the project "${projectRes.rows[0].title}"`, projectId]
        );

        res.json({ message: 'Member removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});


// Creators API
app.get('/api/creators', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM creators ORDER BY display_order ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch creators' });
    }
});

// --- Notification Routes ---
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    const notificationId = req.params.id;
    try {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [notificationId, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
    const notificationId = req.params.id;
    try {
        await db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [notificationId, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});


// Delete account
app.delete('/api/users/me', authenticateToken, async (req, res) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Delete notifications
        await client.query('DELETE FROM notifications WHERE user_id = $1', [req.user.id]);
        await client.query('DELETE FROM notifications WHERE from_user_id = $1', [req.user.id]);

        // 2. Delete messages sent by user
        await client.query('DELETE FROM messages WHERE sender_id = $1', [req.user.id]);

        // 3. Delete comments and likes
        await client.query('DELETE FROM comments WHERE user_id = $1', [req.user.id]);
        await client.query('DELETE FROM likes WHERE user_id = $1', [req.user.id]);
        await client.query('DELETE FROM comment_likes WHERE user_id = $1', [req.user.id]);

        // 4. Delete requests
        await client.query('DELETE FROM requests WHERE user_id = $1', [req.user.id]);

        // 5. Delete project memberships
        await client.query('DELETE FROM project_members WHERE user_id = $1', [req.user.id]);

        // 6. Delete owned projects (cascade will handle messages/requests/members for these projects if configured, but let's be safe)
        // First delete content related to owned projects to avoid FK constraints if not ON DELETE CASCADE
        const ownedProjects = await client.query('SELECT id FROM projects WHERE user_id = $1', [req.user.id]);
        for (const project of ownedProjects.rows) {
            await client.query('DELETE FROM messages WHERE project_id = $1', [project.id]);
            await client.query('DELETE FROM requests WHERE project_id = $1', [project.id]);
            await client.query('DELETE FROM project_members WHERE project_id = $1', [project.id]);
            await client.query('DELETE FROM comments WHERE project_id = $1', [project.id]);
            await client.query('DELETE FROM likes WHERE project_id = $1', [project.id]);
            await client.query('DELETE FROM projects WHERE id = $1', [project.id]);
        }

        // 7. Delete user
        await client.query('DELETE FROM users WHERE id = $1', [req.user.id]);

        await client.query('COMMIT');
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to delete account' });
    } finally {
        client.release();
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} `);
});
