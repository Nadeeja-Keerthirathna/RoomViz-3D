require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');

// Routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const designRoutes = require('./routes/designs');
const furnitureRoutes = require('./routes/furniture');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/furniture', furnitureRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Furniture Room Visualization System API is running.' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 Backend server running on: http://localhost:${PORT}`);
    console.log(`📁 Database initialized at: ${path.join(__dirname, 'db/roomviz.sqlite')}`);
});
