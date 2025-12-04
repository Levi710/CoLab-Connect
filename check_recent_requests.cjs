const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkRequests() {
    try {
        const res = await pool.query(`
            SELECT r.id, r.user_id, u.username, r.project_id, p.title, r.status, r.created_at 
            FROM requests r
            JOIN users u ON r.user_id = u.id
            JOIN projects p ON r.project_id = p.id
            ORDER BY r.created_at DESC
            LIMIT 5
        `);
        console.log('Recent Requests:');
        res.rows.forEach(r => {
            console.log(`[${r.created_at}] User ${r.user_id} (${r.username}) -> Project ${r.project_id} (${r.title}) [${r.status}]`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkRequests();
