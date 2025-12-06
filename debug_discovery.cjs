const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function check() {
    try {
        console.log('Connecting to DB...');
        const resCount = await pool.query('SELECT COUNT(*) FROM projects');
        console.log('Total Projects:', resCount.rows[0].count);

        try {
            const resFeatured = await pool.query('SELECT COUNT(*) FROM projects WHERE is_featured = TRUE');
            console.log('Featured Projects:', resFeatured.rows[0].count);
        } catch (e) {
            console.log('Error querying is_featured (column might be missing):', e.message);
        }


        const resJoin = await pool.query('SELECT COUNT(*) FROM projects p JOIN users u ON p.user_id = u.id');
        console.log('-----------------------------------');
        console.log('Projects with valid User (JOIN):', resJoin.rows[0].count);
        console.log('-----------------------------------');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

check();
