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

// ... (existing code)

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
