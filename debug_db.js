const db = require('./server/db');

async function test() {
    try {
        const res = await db.query('SELECT id, public_id, username FROM users LIMIT 5');
        console.log('Users:', res.rows);
    } catch (err) {
        console.error(err);
    }
}

test();
