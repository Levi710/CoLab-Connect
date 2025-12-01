const db = require('./server/db');

async function test() {
    try {
        const res = await db.query('SELECT public_id FROM users WHERE id = 1');
        const pid = res.rows[0].public_id;
        console.log('Public ID:', pid);
        console.log('Length:', pid.length);
    } catch (err) {
        console.error(err);
    }
}

test();
