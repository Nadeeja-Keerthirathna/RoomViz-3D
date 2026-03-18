# Furniture Room Visualization System

A modern web application for interactive 3D room design and furniture layout. Users can create custom room shapes (including L and T shapes), place furniture, and visualize their designs in a premium, real-time 3D environment.

## 🚀 Quick Start

To run the application locally, follow these steps:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or higher)
- npm (usually comes with Node.js)

### 2. Startup Backend Server
The backend is an Express.js API that handles authentication, room data, and design saving using SQLite.

```bash
cd Backend
# Install dependencies
npm install

# Start the server (runs on http://localhost:5000)
npm run dev
```

### 3. Startup Frontend (React)
The frontend is built with React, Three.js (React Three Fiber), and Vite for high-performance 3D rendering.

```bash
cd roomviz
# Install dependencies
npm install

# Start the development server
npm run dev
```

Once both servers are running, open your browser and navigate to the local URL provided by Vite (usually `http://localhost:5173`).

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19
- **3D Engine**: Three.js & @react-three/fiber
- **Styling**: Vanilla CSS with modern aesthetics
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Build Tool**: Vite

### Backend
- **Framework**: Express.js
- **Database**: SQLite3
- **Auth**: JWT (JSON Web Tokens) & BcryptJS for password hashing
- **Middleware**: CORS, Dotenv

---

## ✨ Features

- **Interactive Room Creation**: Define room dimensions and shapes (Rectangular, L-shaped, T-shaped).
- **2D Layout Tool**: Drag and drop furniture in a top-down view.
- **Real-time 3D Visualization**: Switch instantly to a high-quality 3D view with realistic lighting and controls.
- **Smart Wall Occlusion**: Walls automatically hide based on camera orientation, allowing you to easily see inside.
- **Material Customization**: Change floor colors and wall finishes dynamically.
- **User Accounts**: Sign up and log in to save and manage your room designs.
- **Dashboard**: Track your total rooms and designs in a clean, modern interface.

---

## 🏗 Project Structure

- `/Backend`: Express API server and SQLite database management.
- `/roomviz`: The primary React + Three.js application.
- `/Frontend`: A legacy static HTML version of the interface (for reference).
