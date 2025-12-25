const db = require('./db');

async function run() {
    try {
        console.log("Starting migration...");
        const [rows] = await db.query('SELECT id, creation_date FROM workflow_requests ORDER BY creation_date ASC');
        console.log(`Found ${rows.length} rows.`);
        for (let i = 0; i < rows.length; i++) {
            const oldId = rows[i].id;
            const newId = `Qssun-${String(i + 1).padStart(4, '0')}`;
            if (oldId !== newId) {
                console.log(`Updating ${oldId} -> ${newId}`);
                await db.query('UPDATE workflow_requests SET id = ? WHERE id = ?', [newId, oldId]);
            }
        }
        console.log("Migration complete.");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}
run();
