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
const PORT = process.env.PORT || 5000;
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

// --- Project Routes ---

app.get('/api/projects', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
    const { title, description, category, status, lookingFor, pollQuestion } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO projects (user_id, title, description, category, status, looking_for, poll_question) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [req.user.id, title, description, category, status, lookingFor, pollQuestion]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

app.get('/api/projects/my', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user projects' });
    }
});

// --- Request Routes ---

app.post('/api/requests', authenticateToken, async (req, res) => {
    const { projectId, role, note } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO requests (project_id, user_id, role, note, status) VALUES ($1, $2, $3, $4, \'pending\') RETURNING *',
            [projectId, req.user.id, role, note]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
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

app.put('/api/requests/:id/status', authenticateToken, async (req, res) => {
    const { status } = req.body; // 'accepted' or 'rejected'
    const requestId = req.params.id;
    try {
        // Verify ownership (optional but recommended)
        const result = await db.query(
            'UPDATE requests SET status = $1 WHERE id = $2 RETURNING *',
            [status, requestId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update request status' });
    }
});

// --- Message Routes ---

app.get('/api/messages/:requestId', authenticateToken, async (req, res) => {
    const requestId = req.params.requestId;
    try {
        const result = await db.query(`
            SELECT m.*, u.username as sender_name, u.photo_url as sender_photo
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.request_id = $1
            ORDER BY m.created_at ASC
        `, [requestId]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    const { requestId, content } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO messages (request_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
            [requestId, req.user.id, content]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
