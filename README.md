# Mess Tiffin Management System (MERN Stack)

A complete full-stack web platform for managing Mess/Tiffin services for PG students, featuring separate portals for students and administrators. Built with **React + TypeScript + Tailwind CSS v4 + Vite** on the frontend, and **Node.js + Express.js + MongoDB + Mongoose** on the backend.

---

## Project Structure

```
Mess -mng/
├── frontend/                     # React Single Page Application (SPA)
│   ├── src/                      # UI Components, Assets & Services
│   ├── public/                   # Public static files
│   ├── package.json              # Frontend scripts & dependencies
│   ├── vite.config.ts            # Vite compile and Tailwind configuration
│   └── .env                      # Frontend environment configs
│
├── backend/                      # Node.js + Express.js REST API
│   ├── config/                   # Mongoose Database Connection
│   ├── controllers/              # Business controllers (Auth, CRUD, Toggles)
│   ├── models/                   # Mongoose DB schemas (User, Attendance, etc)
│   ├── middleware/               # Auth protecting & admin role guard middlewares
│   ├── routes/                   # Route routing definitions
│   ├── server.js                 # API Entry Point
│   ├── package.json              # Backend scripts & dependencies
│   └── .env                      # Backend environment configurations
│
└── README.md                     # Setup guide (This file)
```

---

## Seeding Default Credentials
On startup, the backend automatically seeds a default student and administrator in the MongoDB database if no users exist. You can log in using these credentials:

| Portal | Seeded Username/Email | Default Password | Initial Status / Setup |
| :--- | :--- | :--- | :--- |
| **Student Portal** | `student@mess.com` (or `student`) | `password123` | Room 304, Plan: 2-Meal Standard, Active, Unpaid Balance |
| **Admin Portal** | `admin@mess.com` (or `admin`) | `password123` | Role: Admin, Operations monitoring access |

---

## Setup & Running

### 1. MongoDB Database
Ensure you have MongoDB running locally on `mongodb://127.0.0.1:27017/mess_tiffin` or update the `MONGO_URI` in `backend/.env` to point to your MongoDB Atlas cloud cluster.

### 2. Backend Setup
Navigate to the `backend/` folder, configure environment variables, and run the server:
```bash
# Move to backend
cd backend

# Install dependencies
npm install

# Start in development mode (with nodemon auto-restart)
npm run dev

# Or start in standard production mode
npm start
```
The server will run on `http://localhost:5000`.

### 3. Frontend Setup
Navigate to the `frontend/` folder, install libraries, and start the development server:
```bash
# Move to frontend
cd ../frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The client app will run on `http://localhost:5173`. Open this URL in your browser to view the application.

---

## Technologies Used

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, `@tailwindcss/vite`, Lucide Icons, Motion (Framer Motion v12), Axios.
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JSON Web Tokens (JWT), BcryptJS.
