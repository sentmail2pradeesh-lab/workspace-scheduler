# Real-Time Collaborative Workspace Scheduler

A full-stack MVP for booking a shared **Premium Conference Room** in a co-working workspace. Multiple users can view, book, and cancel time slots simultaneously with **live schedule updates** — no page refresh required.

Built as part of a technical assessment using **React.js**, **Tailwind CSS**, **Node.js**, **Express.js**, and **PostgreSQL**.

---

## Live Demo (Local)

| Service   | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:5173      |
| Backend   | http://localhost:3001      |
| Health    | http://localhost:3001/api/health |

---

## Features

### Authentication & Registration
- JWT-based login
- Self-registration with **email OTP verification**
- Optional mobile number
- Role selection: **Standard** or **Supervisor**

### Booking System
- Daily schedule grid: **9:00 AM – 6:00 PM** (30-minute slots)
- Overlap-safe booking — backend rejects conflicting reservations
- Past dates and past time slots are blocked
- Dashboard stats: total slots, booked, available, utilization

### Real-Time Updates
- **Socket.io** broadcasts `schedule:updated` after every booking or cancellation
- All connected clients sync instantly
- Works for standard cancel and supervisor **Cancel Override**

### Role-Based Access Control (RBAC)
| Role       | Permissions                                      |
|------------|--------------------------------------------------|
| Standard   | Book slots · Cancel **own** bookings only        |
| Supervisor | Book slots · **Cancel Override** on any booking  |

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS        |
| Backend    | Node.js, Express.js, Socket.io      |
| Database   | PostgreSQL                          |
| Auth       | JWT, bcrypt, email OTP (nodemailer) |

---

## Project Structure

```
workspace-scheduler/
├── backend/
│   ├── src/
│   │   ├── db/           # Schema, migrations, pool
│   │   ├── middleware/   # JWT auth
│   │   ├── routes/       # Auth & booking API
│   │   ├── services/     # Bookings, OTP, email, broadcast
│   │   └── index.js      # Express + Socket.io server
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # Auth, Calendar, Modal
│   │   ├── context/      # Auth & Socket providers
│   │   ├── api/          # API client
│   │   └── utils/        # Time & validation helpers
│   └── package.json
├── docker-compose.yml    # PostgreSQL (optional)
└── README.md
```

---

## Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** 14 or higher (or Docker)
- **SMTP credentials** for email OTP (Gmail App Password works)

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/sentmail2pradeesh-lab/workspace-scheduler.git
cd workspace-scheduler
```

### 2. Start PostgreSQL

**Option A — Docker**

```bash
docker compose up -d
```

**Option B — Local PostgreSQL**

```sql
CREATE DATABASE workspace_scheduler;
```

### 3. Backend setup

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:MyNewPassword123@localhost:5432/workspace_scheduler
JWT_SECRET=your-long-random-secret-key
CLIENT_URL=http://localhost:5173

# Required for registration OTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=Workspace Scheduler <your-email@gmail.com>
```

Install and initialize:

```bash
npm install
npm run db:init
npm run db:migrate
npm run dev
```

### 4. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Usage Guide

### Register
1. Click **Register**
2. Fill in name, email, password, and role
3. Click **Send verification code**
4. Check your email for the 6-digit OTP
5. Enter OTP and create your account

### Book a slot
1. Sign in
2. Select a date (today or future)
3. Click **Book** on an available slot
4. Choose end time and confirm

### Test real-time sync
1. Open two browser windows (normal + incognito)
2. Register/login as two different users
3. Book a slot in one window — it appears as **Reserved** in the other instantly
4. Cancel or use **Cancel Override** (Supervisor) — both windows update live

---

## API Reference

| Method | Endpoint                              | Auth | Description                    |
|--------|---------------------------------------|------|--------------------------------|
| POST   | `/api/auth/register/request-otp`      | No   | Send email OTP                 |
| POST   | `/api/auth/register/verify`           | No   | Verify OTP & create account    |
| POST   | `/api/auth/login`                     | No   | Login, returns JWT             |
| GET    | `/api/auth/me`                        | Yes  | Current user profile           |
| GET    | `/api/bookings?date=YYYY-MM-DD`       | Yes  | List bookings for a date       |
| POST   | `/api/bookings`                       | Yes  | Create a booking               |
| DELETE | `/api/bookings/:id`                   | Yes  | Cancel own booking             |
| DELETE | `/api/bookings/:id?override=true`     | Sup. | Supervisor cancel override     |

### WebSocket Event

```
schedule:updated → { date: "YYYY-MM-DD", bookings: [...] }
```

Broadcast after every successful booking or cancellation.

---

## Overlap Prevention

Bookings use a transactional overlap check with row locking:

```sql
SELECT id FROM bookings
WHERE date = $1
  AND start_time < $end_time
  AND end_time > $start_time
FOR UPDATE;
```

Example: If User A books **2:00 PM – 3:00 PM**, User B cannot book **2:30 PM – 3:30 PM** (HTTP 409).

---

## Environment Variables

| Variable       | Required | Description                          |
|----------------|----------|--------------------------------------|
| `PORT`         | No       | Backend port (default: 3001)         |
| `DATABASE_URL` | Yes      | PostgreSQL connection string         |
| `JWT_SECRET`   | Yes      | Secret for signing JWT tokens        |
| `CLIENT_URL`   | No       | Frontend URL for CORS (default: 5173)|
| `SMTP_HOST`    | Yes*     | SMTP server hostname                 |
| `SMTP_PORT`    | No       | SMTP port (default: 587)             |
| `SMTP_USER`    | Yes*     | SMTP username / email                |
| `SMTP_PASS`    | Yes*     | SMTP password / app password         |
| `SMTP_FROM`    | No       | Sender display name                  |

*Required for user registration.

---

## Scripts

### Backend

| Command            | Description                |
|--------------------|----------------------------|
| `npm run dev`      | Start dev server (watch)   |
| `npm start`        | Start production server    |
| `npm run db:init`  | Create database tables     |
| `npm run db:migrate` | Apply schema migrations  |

### Frontend

| Command         | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Start Vite dev server    |
| `npm run build` | Production build         |
| `npm run preview` | Preview production build |

---

## What to Push to GitHub

Include these files/folders:

```
✅ backend/          (source code + package.json + .env.example)
✅ frontend/         (source code + package.json)
✅ docker-compose.yml
✅ README.md
✅ .gitignore
```

Do **NOT** commit:

```
❌ backend/.env          (contains secrets)
❌ frontend/.env
❌ node_modules/
❌ dist/
❌ .DS_Store
```

---

## Troubleshooting

| Issue                          | Solution                                              |
|--------------------------------|-------------------------------------------------------|
| OTP not received               | Check SMTP settings in `.env`; use Gmail App Password |
| `npm install` SSL error        | Run `npm install --strict-ssl=false` on Windows       |
| Cancel shows "Booking not found" | Refresh page; ensure backend is running latest code |
| Real-time not updating         | Confirm backend on port 3001; check Live badge in UI  |
| Database connection failed     | Verify PostgreSQL is running and `DATABASE_URL` is correct |

---

## Author

**Pradeeshwaran M**  
Technical Assessment — Real-Time Collaborative Workspace Scheduler

GitHub: [https://github.com/sentmail2pradeesh-lab/workspace-scheduler](https://github.com/sentmail2pradeesh-lab/workspace-scheduler)

---

## License

This project was built for evaluation purposes.
