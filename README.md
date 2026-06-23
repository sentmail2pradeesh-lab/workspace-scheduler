# Real-Time Collaborative Workspace Scheduler

A mini-MVP for booking a shared premium conference room with real-time schedule updates across all connected clients.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Socket.io Client
- **Backend:** Node.js, Express, Socket.io, JWT
- **Database:** PostgreSQL

## Features

- JWT authentication with **Standard** and **Supervisor** roles
- Calendar grid (9:00 AM – 6:00 PM) with 30-minute slots
- Overlap-safe booking (server rejects conflicting reservations)
- Real-time updates via WebSockets when bookings are created or canceled
- RBAC: Standard users cancel only their own bookings; Supervisors get **Cancel Override** on any reservation

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)

## Quick Start with Docker (PostgreSQL)

```bash
docker compose up -d
```

Then follow the backend setup below. The default `.env` already points to `postgresql://postgres:postgres@localhost:5432/workspace_scheduler`.

## Setup

### 1. Create the database

```sql
CREATE DATABASE workspace_scheduler;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL connection string and JWT secret

npm install
npm run db:init
npm run db:migrate
npm run dev
```

Server runs at `http://localhost:3001`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Registration

Users self-register via the **Register** tab with email OTP verification. Mobile number is optional. No pre-defined accounts.

In development, the OTP is shown in the UI and logged to the backend console.

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/request-otp` | No | Send registration OTP to mobile |
| POST | `/api/auth/register/verify` | No | Verify OTP and create account |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/bookings?date=YYYY-MM-DD` | Yes | List bookings for date |
| POST | `/api/bookings` | Yes | Create booking |
| DELETE | `/api/bookings/:id` | Yes | Cancel own booking |
| DELETE | `/api/bookings/:id?override=true` | Supervisor | Cancel any booking |

### WebSocket Events

- `booking:created` — `{ date, booking }`
- `booking:deleted` — `{ date, bookingId }`

## Overlap Prevention

Bookings use a transactional `SELECT … FOR UPDATE` overlap check:

```sql
start_time < new_end AND end_time > new_start
```

If User A books 14:00–15:00, User B cannot book 14:30–15:30 (HTTP 409).

## Testing Real-Time Updates

1. Open `http://localhost:5173` in two browser windows (or normal + incognito).
2. Log in as Alice in one, Bob in the other.
3. Book a slot in one window — it appears as **Reserved** in the other instantly.
4. Log in as Supervisor to use **Cancel Override** on another user's booking.
