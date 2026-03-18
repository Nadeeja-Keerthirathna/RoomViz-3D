const express = require('express');
const router = express.Router();
const db = require('../db/database');
const authenticate = require('../middleware/auth');

// Save a design layout
router.post('/', authenticate, (req, res) => {
    const { room_id, title, layout_json } = req.body;
    if (!room_id || !layout_json) {
        return res.status(400).json({ error: 'room_id and layout_json are required' });
    }

    const layoutStr = typeof layout_json === 'string' ? layout_json : JSON.stringify(layout_json);

    db.run(
        `INSERT INTO designs (user_id, room_id, title, layout_json) VALUES (?, ?, ?, ?)`,
        [req.user.id, room_id, title || 'Untitled Design', layoutStr],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, message: 'Design saved' });
        }
    );
});

// Get all designs for user
router.get('/', authenticate, (req, res) => {
    db.all(
        `SELECT d.*, r.name as room_name, r.width, r.length, r.shape, r.material
         FROM designs d
         JOIN rooms r ON d.room_id = r.id
         WHERE d.user_id = ?
         ORDER BY d.last_edited DESC`,
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            // Parse layout_json back to object
            const designs = rows.map(row => {
                let layout = [];
                try {
                    layout = row.layout_json ? JSON.parse(row.layout_json) : [];
                } catch (e) {
                    console.error('JSON parse error for design:', row.id, e);
                }
                return {
                    ...row,
                    layout_json: layout
                };
            });
            res.json(designs);
        }
    );
});

// Get single design
router.get('/:id', authenticate, (req, res) => {
    db.get(
        `SELECT d.*, r.name as room_name, r.width, r.length, r.shape, r.material
         FROM designs d
         JOIN rooms r ON d.room_id = r.id
         WHERE d.id = ? AND d.user_id = ?`,
        [req.params.id, req.user.id],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Design not found' });
            try {
                row.layout_json = row.layout_json ? JSON.parse(row.layout_json) : [];
            } catch (e) {
                console.error('JSON parse error for design:', row.id, e);
                row.layout_json = [];
            }
            res.json(row);
        }
    );
});

// Update design (edit layout)
router.put('/:id', authenticate, (req, res) => {
    const { title, layout_json } = req.body;
    const layoutStr = typeof layout_json === 'string' ? layout_json : JSON.stringify(layout_json);

    db.run(
        `UPDATE designs SET title = ?, layout_json = ?, last_edited = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
        [title, layoutStr, req.params.id, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Design not found' });
            res.json({ message: 'Design updated' });
        }
    );
});

// Delete design
router.delete('/:id', authenticate, (req, res) => {
    console.log(`[DELETE] Request to delete design ${req.params.id} by user ${req.user.id}`);
    db.run(`DELETE FROM designs WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
        if (err) {
            console.error(`[DELETE ERROR] Failed to delete design ${req.params.id}:`, err);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            console.warn(`[DELETE WARN] Design ${req.params.id} not found or not owned by user ${req.user.id}`);
            return res.status(404).json({ error: 'Design not found' });
        }
        console.log(`[DELETE SUCCESS] Design ${req.params.id} deleted.`);
        res.json({ message: 'Design deleted' });
    });
});

module.exports = router;
