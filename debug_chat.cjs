const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function debugMessages() {
    try {
        console.log('Checking users public_id...');
        const users = await pool.query('SELECT id, username, public_id FROM users LIMIT 5');
        console.log('Users:', users.rows);

        console.log('Checking messages query...');
        // Get a project with messages
        const projRes = await pool.query('SELECT DISTINCT project_id FROM messages LIMIT 1');
        if (projRes.rows.length === 0) {
            console.log('No messages found in any project');
            return;
        }
        const projectId = projRes.rows[0].project_id;
        console.log('Project ID:', projectId);

        const result = await pool.query(`
            SELECT m.id, m.content, u.username as sender_name, u.public_id as sender_public_id
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.project_id = $1
            LIMIT 5
        `, [projectId]);

        console.log('Messages:', result.rows);
    } catch (err) {
        console.error(err);
        require('fs').writeFileSync('debug_error.txt', err.toString() + '\n' + err.stack);
    } finally {
        pool.end();
    }
}

debugMessages();
