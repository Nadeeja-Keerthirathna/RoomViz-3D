const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get full furniture catalog (public — no auth needed)
router.get('/', (req, res) => {
    const { category } = req.query;
    let query = `SELECT * FROM furniture_catalog`;
    let params = [];

    if (category && category !== 'All') {
        query += ` WHERE category = ?`;
        params.push(category);
    }

    query += ` ORDER BY category, label`;

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get single furniture item
router.get('/:id', (req, res) => {
    db.get(`SELECT * FROM furniture_catalog WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Furniture not found' });
        res.json(row);
    });
});

module.exports = router;
