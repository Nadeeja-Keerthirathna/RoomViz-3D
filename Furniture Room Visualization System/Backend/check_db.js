const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db/roomviz.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- Database Check ---');
db.all('SELECT * FROM rooms', (err, rooms) => {
    if (err) console.error(err);
    console.log('Rooms:', rooms);

    db.all('SELECT * FROM designs', (err, designs) => {
        if (err) console.error(err);
        console.log('Designs:', designs);
        db.close();
    });
});
