
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db/roomviz.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- Database Summary ---');
db.serialize(() => {
    db.get('SELECT COUNT(*) as count FROM rooms', (err, row) => {
        console.log('Total Rooms:', row.count);
    });
    db.get('SELECT COUNT(*) as count FROM designs', (err, row) => {
        console.log('Total Designs:', row.count);
    });
    db.all('SELECT id, name, user_id FROM rooms', (err, rows) => {
        console.log('Room list:', rows);
    });
    db.all('SELECT id, title, room_id, user_id FROM designs', (err, rows) => {
        console.log('Design list:', rows);
    });
});
db.close();
