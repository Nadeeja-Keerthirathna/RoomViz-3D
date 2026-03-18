# RoomViz Backend API

A Node.js/Express server that serves as the backend for the Furniture Room Visualization System.

## 🚀 Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Configuration**:
    Ensure you have a `.env` file in this directory with the following variables:
    ```env
    PORT=5000
    JWT_SECRET=your_secure_secret_key
    ```

3.  **Start the server**:
    ```bash
    # Development mode (with nodemon)
    npm run dev

    # Production mode
    npm start
    ```

---

## 🛠 Tech Stack

- **Express.js**: Web server framework.
- **SQLite3**: Simple, file-based database.
- **JWT**: Authorization using JSON Web Tokens.
- **Nodemon**: Auto-restarts server on code changes (dev only).

---

## 📂 Key Folders

- `/db`: Database schema and SQLite file.
- `/routes`: API endpoints for Auth, Rooms, Designs, and Furniture.
- `/middleware`: Authentication guards.
- `server.js`: Main entry point.
