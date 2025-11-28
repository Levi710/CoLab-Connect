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

app.use(cors());
app.use(express.json());

// Initialize DB Schema
async function initDb() {
    try {
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await db.query(schemaSql);

        // Migration: Add photo_url if not exists
        try {
            await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT');
            console.log('Checked/Added photo_url column');
        } catch (e) {
            console.log('Migration note:', e.message);
        }

        console.log('Database schema initialized');
    } catch (err) {
        console.error('Error initializing database schema:', err);
    }
}

// ... (existing code)

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, email, bio, skills, photo_url, is_premium FROM users WHERE id = $1', [req.user.id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
    const { bio, skills, photo_url } = req.body;
    try {
        const result = await db.query(
            'UPDATE users SET bio = $1, skills = $2, photo_url = $3 WHERE id = $4 RETURNING id, username, email, bio, skills, photo_url, is_premium',
            [bio, skills, photo_url, req.user.id]
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
            'INSERT INTO requests (project_id, user_id, role, note) VALUES ($1, $2, $3, $4) RETURNING *',
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
