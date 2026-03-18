const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../db');
const dbPath = path.join(dbDir, 'roomviz.sqlite');

// Ensure db directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        // Enable foreign keys
        db.run("PRAGMA foreign_keys = ON;");
        // Initialize tables
        initDB();
    }
});

function initDB() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Rooms table
        db.run(`CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            width REAL NOT NULL,
            length REAL NOT NULL,
            shape TEXT DEFAULT 'rectangular',
            material TEXT DEFAULT 'wood',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        // Designs table (DesignFurniture table)
        db.run(`CREATE TABLE IF NOT EXISTS designs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            room_id INTEGER NOT NULL,
            title TEXT,
            layout_json TEXT NOT NULL,
            last_edited DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE
        )`);

        // Furniture Catalog table
        db.run(`CREATE TABLE IF NOT EXISTS furniture_catalog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            label TEXT NOT NULL,
            width REAL,
            depth REAL,
            color TEXT,
            icon TEXT,
            category TEXT
        )`);

        // Seed initial furniture if empty
        db.get("SELECT COUNT(*) as count FROM furniture_catalog", (err, row) => {
            if (row && row.count === 0) {
                const catalog = [
                    ['sofa', '3-Seater Sofa', 2.1, 0.9, '#2a4030', '🛋', 'Seating'],
                    ['armchair', 'Nordic Armchair', 0.85, 0.8, '#2a4030', '💺', 'Seating'],
                    ['dining-chair', 'Dining Chair', 0.45, 0.45, '#3a2a15', '🪑', 'Seating'],
                    ['coffee-table', 'Coffee Table', 1.2, 0.6, '#3a2a10', '🪵', 'Tables'],
                    ['dining-table', 'Dining Table', 1.8, 0.9, '#3a2a10', '🍽', 'Tables'],
                    ['bed', 'Queen Bed', 1.6, 2.0, '#1a2540', '🛏', 'Bedroom'],
                    ['wardrobe', 'Wardrobe', 1.8, 0.6, '#1a200a', '🪞', 'Storage'],
                    ['desk', 'Work Desk', 1.4, 0.7, '#3a2a10', '🖥', 'Office'],
                    ['plant', 'Indoor Plant', 0.5, 0.5, '#183a18', '🌿', 'Decor'],
                    ['lamp', 'Floor Lamp', 0.4, 0.4, '#2a2000', '💡', 'Lighting'],
                    ['bookshelf', 'Bookshelf', 1.0, 0.35, '#1a1410', '📚', 'Storage'],
                    ['tv-unit', 'TV Unit', 1.8, 0.5, '#111111', '📺', 'Living']
                ];
                const stmt = db.prepare("INSERT INTO furniture_catalog (type, label, width, depth, color, icon, category) VALUES (?, ?, ?, ?, ?, ?, ?)");
                catalog.forEach(item => stmt.run(item));
                stmt.finalize();
                console.log('Seeded furniture catalog');
            }
        });
    });
}

module.exports = db;
