const express = require('express');
const cors = require('cors');
const db = require('./db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Razorpay = require('razorpay');

// ... (existing imports)

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Razorpay Instance (Use environment variables in production)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag', // Test Key
    key_secret: process.env.RAZORPAY_KEY_SECRET || 's4g4r123' // Placeholder/Test Secret
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
async function initDb() {
    try {
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await db.query(schemaSql);

        // --- Migrations ---
        // Migration: Add photo_url if not exists
        try {
            await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT');
            console.log('Checked/Added photo_url column');
        } catch (e) { console.log('Migration note:', e.message); }

        // Migration: Add background_url if not exists
        try {
            await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS background_url TEXT');
            console.log('Checked/Added background_url column');
        } catch (e) { console.log('Migration note:', e.message); }

        // Migration: Add image_url and is_edited to messages
        try {
            await db.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT');
            await db.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE');
            console.log('Checked/Added messages columns');
        } catch (e) { console.log('Migration note:', e.message); }

        // Migration: Add updated_at to projects
        try {
            await db.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            console.log('Checked/Added projects columns');
        } catch (e) { console.log('Migration note:', e.message); }

        // Migration: Add status to requests if not exists
        try {
            await db.query('ALTER TABLE requests ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'pending\'');
            console.log('Checked/Added status column to requests');
        } catch (e) { console.log('Migration note:', e.message); }

        // Migration: Create messages table if not exists
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    request_id INTEGER REFERENCES requests(id),
                    sender_id INTEGER REFERENCES users(id),
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Checked/Created messages table');
        } catch (e) { console.log('Migration note:', e.message); }

        // Migration: Add member_limit to projects if not exists
        try {
            await db.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS member_limit INTEGER DEFAULT 5');
            console.log('Checked/Added member_limit column to projects');
        } catch (e) { console.log('Migration note:', e.message); }

        // Migration: Create project_members table if not exists
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS project_members (
                    id SERIAL PRIMARY KEY,
                    project_id INTEGER REFERENCES projects(id),
                    user_id INTEGER REFERENCES users(id),
                    role VARCHAR(100) DEFAULT 'Member',
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(project_id, user_id)
                )
            `);
            console.log('Checked/Created project_members table');
        } catch (e) { console.log('Migration note:', e.message); }

        // Migration: Ensure UNIQUE constraint on project_members
        try {
            await db.query(`
                ALTER TABLE project_members 
                ADD CONSTRAINT project_members_project_id_user_id_key 
                UNIQUE (project_id, user_id)
            `);
            console.log('Checked/Added UNIQUE constraint to project_members');
        } catch (e) {
            // Ignore if constraint already exists
            // console.log('Migration note (constraint):', e.message); 
        }

        // Migration: Add project_id to messages if not exists
        try {
            await db.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id)');
            await db.query('ALTER TABLE messages ALTER COLUMN request_id DROP NOT NULL');
            console.log('Checked/Added project_id column to messages');
        } catch (e) { console.log('Migration note:', e.message); }

        // Migration: Backfill project owners into project_members
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

        // Migration: Backfill members from accepted requests
        try {
            await db.query(`
                INSERT INTO project_members (project_id, user_id, role)
                SELECT r.project_id, r.user_id, r.role
                FROM requests r
                WHERE r.status = 'accepted'
                AND NOT EXISTS (
                    SELECT 1 FROM project_members pm WHERE pm.project_id = r.project_id AND pm.user_id = r.user_id
                )
            `);
            console.log('Checked/Backfilled members from accepted requests');
        } catch (e) { console.log('Migration note:', e.message); }

        // ... (migrations continued)

        // Migration: Create notifications table if not exists
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    type VARCHAR(50), -- 'request_accepted', 'request_received', etc.
                    content TEXT NOT NULL,
                    related_id INTEGER, -- e.g., project_id or request_id
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Checked/Created notifications table');
        } catch (e) { console.log('Migration note:', e.message); }

        // Migration: Add image_url and is_edited to messages if not exists
        try {
            await db.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT');
            await db.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE');
            console.log('Checked/Added image_url and is_edited to messages');
        } catch (e) { console.log('Migration note:', e.message); }

        // Migration: Add updated_at to projects if not exists (for edit tracking)
        try {
            await db.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP');
            console.log('Checked/Added updated_at to projects');
        } catch (e) { console.log('Migration note:', e.message); }

        // Migration: Create likes table
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS likes (
                    id SERIAL PRIMARY KEY,
                    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(project_id, user_id)
                )
            `);
            console.log('Checked/Created likes table');
        } catch (e) { console.log('Migration note:', e.message); }

        // Migration: Create comments table
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS comments (
                    id SERIAL PRIMARY KEY,
                    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Checked/Created comments table');
        } catch (e) { console.log('Migration note:', e.message); }

        console.log('Database schema initialized');
    } catch (err) {
        console.error('Error initializing database schema:', err);
    }
}

// Wait for DB to be ready then init
setTimeout(initDb, 5000);

// Middleware to authenticate token
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

// ... (Payment and AI routes remain unchanged) ...
// --- Payment Routes ---

app.post('/api/payment/order', authenticateToken, async (req, res) => {
    const options = {
        amount: 100, // amount in the smallest currency unit (100 paise = 1 INR)
        currency: "INR",
        receipt: `receipt_order_${Date.now()}`
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Razorpay Error:", error);
        res.status(500).send(error);
    }
});

app.post('/api/payment/verify', authenticateToken, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 's4g4r123');
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
        try {
            // Update user to premium
            await db.query('UPDATE users SET is_premium = TRUE WHERE id = $1', [req.user.id]);
            res.json({ status: 'success', message: 'Payment verified and user upgraded' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update user status' });
        }
    } else {
        res.status(400).json({ status: 'failure', message: 'Invalid signature' });
    }
});

// --- AI Analysis Route ---

app.get('/api/ai/analysis', authenticateToken, async (req, res) => {
    try {
        // Check if user is premium
        const userRes = await db.query('SELECT is_premium FROM users WHERE id = $1', [req.user.id]);
        if (!userRes.rows[0].is_premium) {
            return res.status(403).json({ error: 'Premium access required' });
        }

        // Mock AI Analysis Data
        const analysisData = {
            projectGrowth: [12, 19, 3, 5, 2, 3],
            audienceDemographics: {
                'Developers': 45,
                'Designers': 25,
                'Managers': 20,
                'Others': 10
            },
            suggestions: [
                "Your project 'EcoTrack' is trending in the 'Tech' category.",
                "Consider adding more details to your 'Looking For' section to attract senior developers.",
                "Based on current trends, adding a 'Mobile App' component could increase engagement by 20%."
            ]
        };

        // Simulate AI processing delay
        setTimeout(() => {
            res.json(analysisData);
        }, 1000);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate analysis' });
    }
});

// --- Auth Routes ---

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, is_premium',
            [username, email, hashedPassword]
        );
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ token, user });
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        delete user.password;
        res.json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, email, bio, skills, photo_url, background_url, is_premium FROM users WHERE id = $1', [req.user.id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
    const { bio, skills, photo_url, background_url } = req.body;
    try {
        const result = await db.query(
            'UPDATE users SET bio = $1, skills = $2, photo_url = $3, background_url = $4 WHERE id = $5 RETURNING id, username, email, bio, skills, photo_url, background_url, is_premium',
            [bio, skills, photo_url, background_url, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// --- Notification Routes ---

app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// --- Project Routes ---

app.get('/api/projects', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, 
            (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
            (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) as comments_count
            FROM projects p 
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});


app.get('/api/projects/my', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, 
            (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
            (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) as comments_count
            FROM projects p 
            WHERE p.user_id = $1
            ORDER BY created_at DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch my projects' });
    }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
    const { title, description, category, status, lookingFor, pollQuestion, memberLimit } = req.body;
    console.log('Creating project:', { user_id: req.user.id, title, category, memberLimit });

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

        res.json(project);

        // Update project likes count
        const countRes = await db.query('SELECT COUNT(*) FROM likes WHERE project_id = $1', [projectId]);
        const newCount = parseInt(countRes.rows[0].count);

        await db.query('UPDATE projects SET likes = $1 WHERE id = $2', [newCount, projectId]);

        res.json({ likes: newCount, liked: check.rows.length === 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
});

app.get('/api/projects/:id/comments', async (req, res) => {
    const projectId = req.params.id;
    try {
        const result = await db.query(`
            SELECT c.*, u.username, u.photo_url 
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
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment content is required' });
    }

    try {
        const result = await db.query(`
            INSERT INTO comments (project_id, user_id, content)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [projectId, userId, content]);

        const newComment = result.rows[0];

        // Fetch user details for the response
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
        // Check if project exists and get owner
        const projectRes = await db.query('SELECT user_id FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if user is owner
        if (projectRes.rows[0].user_id === req.user.id) {
            return res.status(400).json({ error: 'Cannot apply to your own project' });
        }

        // Check if already a member
        const memberCheck = await db.query('SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (memberCheck.rows.length > 0) {
            return res.status(400).json({ error: 'You are already a member of this project' });
        }

        // Check if already applied (pending)
        const existing = await db.query('SELECT * FROM requests WHERE project_id = $1 AND user_id = $2 AND status = \'pending\'', [projectId, req.user.id]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Request already pending' });
        }

        const result = await db.query(
            'INSERT INTO requests (project_id, user_id, role, note, status) VALUES ($1, $2, $3, $4, \'pending\') RETURNING *',
            [projectId, req.user.id, role, note]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error sending request:', err);
        res.status(500).json({ error: 'Failed to send request' });
    }
});

app.get('/api/requests/my-projects', authenticateToken, async (req, res) => {
    try {
        // Get requests for projects owned by the current user
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

        // Verify ownership (project owner can delete) OR requester can delete
        const projectRes = await db.query('SELECT user_id FROM projects WHERE id = $1', [request.project_id]);

        // Allow if user is the requester OR the project owner
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
    const { status } = req.body; // 'accepted' or 'rejected'
    const requestId = req.params.id;
    try {
        const requestRes = await db.query('SELECT * FROM requests WHERE id = $1', [requestId]);
        const request = requestRes.rows[0];

        if (!request) return res.status(404).json({ error: 'Request not found' });

        // Verify ownership
        const projectRes = await db.query('SELECT user_id, member_limit, title FROM projects WHERE id = $1', [request.project_id]);
        if (projectRes.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (status === 'accepted') {
            // Check member limit
            const membersRes = await db.query('SELECT COUNT(*) FROM project_members WHERE project_id = $1', [request.project_id]);
            const memberCount = parseInt(membersRes.rows[0].count);
            if (memberCount >= projectRes.rows[0].member_limit) {
                return res.status(400).json({ error: 'Project is full' });
            }

            // Add to project_members
            console.log(`Adding user ${request.user_id} to project ${request.project_id} as ${request.role}`);
            const insertRes = await db.query(
                'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO NOTHING RETURNING *',
                [request.project_id, request.user_id, request.role]
            );
            console.log('Insert result:', insertRes.rows);
        }

        const result = await db.query(
            'UPDATE requests SET status = $1 WHERE id = $2 RETURNING *',
            [status, requestId]
        );

        await db.query(
            'INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, $2, $3, $4)',
            [request.user_id, 'request_' + status, notificationContent, request.project_id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update request status' });
    }
});

// --- Chat / Room Routes ---

app.get('/api/chat/rooms', authenticateToken, async (req, res) => {
    try {
        // Get projects where user is a member or owner
        const result = await db.query(`
            SELECT p.*, pm.role as my_role
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
        // Verify membership
        const memberCheck = await db.query('SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not a member of this project' });
        }

        const result = await db.query(`
            SELECT m.*, u.username as sender_name, u.photo_url as sender_photo
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.project_id = $1
            ORDER BY m.created_at ASC
            `, [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    const { projectId, content, image_url } = req.body;
    try {
        // Verify membership
        const memberCheck = await db.query('SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not a member of this project' });
        }

        // Check premium if sending image
        if (image_url) {
            const userRes = await db.query('SELECT is_premium FROM users WHERE id = $1', [req.user.id]);
            if (!userRes.rows[0].is_premium) {
                return res.status(403).json({ error: 'Image sending is a Premium feature' });
            }
        }

        const result = await db.query(
            'INSERT INTO messages (project_id, sender_id, content, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [projectId, req.user.id, content, image_url]
        );

        // Fetch sender details to return complete message object
        const senderRes = await db.query('SELECT username, photo_url FROM users WHERE id = $1', [req.user.id]);
        const message = { ...result.rows[0], sender_name: senderRes.rows[0].username, sender_photo: senderRes.rows[0].photo_url };

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

        // Check time limit (10 mins)
        const createdAt = new Date(message.created_at);
        const now = new Date();
        const diffMinutes = (now - createdAt) / 1000 / 60;

        if (diffMinutes > 10) {
            return res.status(403).json({ error: 'Edit time limit exceeded (10 mins)' });
        }

        const result = await db.query(
            'UPDATE messages SET content = $1, is_edited = TRUE WHERE id = $2 RETURNING *',
            [content, messageId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update message' });
    }
});

// --- Member Management Routes ---
// ... (rest of the file)

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
        // Verify requester is owner
        const projectRes = await db.query('SELECT user_id FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Only project owner can remove members' });
        }

        // Cannot remove self (owner)
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ error: 'Cannot remove yourself' });
        }

        await db.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
        res.json({ message: 'Member removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} `);
});
