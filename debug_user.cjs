const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function getUser() {
    try {
        const res = await pool.query(`
            SELECT u.id, u.username, 
            (SELECT COUNT(*) FROM requests WHERE project_id IN (SELECT id FROM projects WHERE user_id = u.id)) as pending_req_count,
            (SELECT COUNT(*) FROM notifications WHERE user_id = u.id AND is_read = FALSE) as unread_notif_count
            FROM users u
        `);
        res.rows.forEach(u => {
            const total = parseInt(u.pending_req_count) + parseInt(u.unread_notif_count);
            if (total >= 1) {
                console.log(`User ${u.id} (${u.username}): PendingReq=${u.pending_req_count}, UnreadNotif=${u.unread_notif_count}, Total=${total}`);
            }
        });
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

getUser();
