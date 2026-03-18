const express = require('express');
const router = express.Router();
const db = require('../db/database');
const authenticate = require('../middleware/auth');

// Create a room
router.post('/', authenticate, (req, res) => {
    const { name, width, length, shape, material } = req.body;
    if (!name || !width || !length) {
        return res.status(400).json({ error: 'Name, width and length are required' });
    }

    db.run(
        `INSERT INTO rooms (user_id, name, width, length, shape, material) VALUES (?, ?, ?, ?, ?, ?)`,
        [req.user.id, name, width, length, shape || 'rectangular', material || 'wood'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, message: 'Room created' });
        }
    );
});

// Get all rooms for user
router.get('/', authenticate, (req, res) => {
    db.all(`SELECT * FROM rooms WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get single room
router.get('/:id', authenticate, (req, res) => {
    db.get(`SELECT * FROM rooms WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Room not found' });
        res.json(row);
    });
});

// Update room
router.put('/:id', authenticate, (req, res) => {
    const { name, width, length, shape, material } = req.body;
    db.run(
        `UPDATE rooms SET name = ?, width = ?, length = ?, shape = ?, material = ? WHERE id = ? AND user_id = ?`,
        [name, width, length, shape, material, req.params.id, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Room not found' });
            res.json({ message: 'Room updated' });
        }
    );
});

// Delete room (also deletes all associated designs first)
router.delete('/:id', authenticate, (req, res) => {
    console.log(`[DELETE] Request to delete room ${req.params.id} by user ${req.user.id}`);
    // First delete all designs associated with this room
    db.run(
        `DELETE FROM designs WHERE room_id = ? AND user_id = ?`,
        [req.params.id, req.user.id],
        function (err) {
            if (err) {
                console.error(`[DELETE ERROR] Failed to delete designs for room ${req.params.id}:`, err);
                return res.status(500).json({ error: 'Failed to delete designs: ' + err.message });
            }
            console.log(`[DELETE] Deleted designs for room ${req.params.id}. Count: ${this.changes}`);
            // Now delete the room itself
            db.run(
                `DELETE FROM rooms WHERE id = ? AND user_id = ?`,
                [req.params.id, req.user.id],
                function (err2) {
                    if (err2) {
                        console.error(`[DELETE ERROR] Failed to delete room ${req.params.id}:`, err2);
                        return res.status(500).json({ error: err2.message });
                    }
                    if (this.changes === 0) {
                        console.warn(`[DELETE WARN] Room ${req.params.id} not found or not owned by user ${req.user.id}`);
                        return res.status(404).json({ error: 'Room not found' });
                    }
                    console.log(`[DELETE SUCCESS] Room ${req.params.id} deleted.`);
                    res.json({ message: 'Room and its designs deleted' });
                }
            );
        }
    );
});

module.exports = router;
