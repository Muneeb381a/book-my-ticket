# Book My Ticket — Backend API

A movie ticket booking REST API built with Node.js, Express, and MongoDB. Supports user auth, seat selection, concurrent booking prevention, and a full booking lifecycle.

---

## Features

- JWT authentication with access + refresh tokens
- Email verification and password reset
- Movie and theater/screen management (admin)
- Show scheduling with overlap detection
- Seat locking — prevents double booking using atomic MongoDB updates
- Booking confirmation, cancellation, and history
- Swagger docs at `/api-docs`

---

## Tech Stack

| Layer      | Tech                        |
|------------|-----------------------------|
| Runtime    | Node.js (ESM)               |
| Framework  | Express 5                   |
| Database   | MongoDB + Mongoose           |
| Auth       | JWT (access + refresh)      |
| Validation | Joi                         |
| Docs       | Swagger (swagger-jsdoc)     |
| Email      | Nodemailer                  |

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd BOOKING_SYSTEM
npm install
```

### 2. Set up environment variables

```bash
cp env.example .env
```

Fill in your `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/booking_system

JWT_ACCESS_SECRET=your_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d

SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_pass
SMTP_FROM_EMAIL=noreply@bookmyticket.com

CLIENT_URL=http://localhost:3000
```

> For email in dev, use [Mailtrap](https://mailtrap.io) — it catches all outgoing mail without actually sending.

### 3. Run

```bash
npm run dev     # development (with --watch)
npm start       # production
```

---

## API Overview

### Auth — `/api/auth`

| Method | Endpoint                    | Auth | Description              |
|--------|-----------------------------|------|--------------------------|
| POST   | `/register`                 | —    | Register + verify email  |
| POST   | `/login`                    | —    | Login, get tokens        |
| POST   | `/logout`                   | ✓    | Invalidate session       |
| POST   | `/refresh`                  | —    | Rotate access token      |
| GET    | `/me`                       | ✓    | Get profile              |
| GET    | `/verify-email/:token`      | —    | Verify email             |
| POST   | `/forgot-password`          | —    | Send reset link          |
| POST   | `/reset-password/:token`    | —    | Set new password         |

### Movies — `/api/movies`

| Method | Endpoint  | Auth  | Description          |
|--------|-----------|-------|----------------------|
| GET    | `/`       | —     | List movies          |
| GET    | `/:id`    | —     | Get movie detail     |
| POST   | `/`       | admin | Create movie         |
| PATCH  | `/:id`    | admin | Update movie         |
| DELETE | `/:id`    | admin | Soft-delete movie    |

### Theaters — `/api/theaters`

| Method | Endpoint                          | Auth  | Description        |
|--------|-----------------------------------|-------|--------------------|
| GET    | `/`                               | —     | List theaters      |
| GET    | `/:id`                            | —     | Theater + screens  |
| POST   | `/`                               | admin | Create theater     |
| POST   | `/:theaterId/screens`             | admin | Add screen         |
| GET    | `/:theaterId/screens/:screenId`   | —     | Screen + seat map  |

### Shows — `/api/shows`

| Method | Endpoint         | Auth  | Description                      |
|--------|------------------|-------|----------------------------------|
| GET    | `/`              | —     | List shows (filter by city/date) |
| GET    | `/:id/seats`     | ✓     | Seat map with live status        |
| POST   | `/`              | admin | Schedule show + generate seats   |
| PATCH  | `/:id/cancel`    | admin | Cancel show                      |

### Bookings — `/api/bookings`

| Method | Endpoint      | Auth | Description                    |
|--------|---------------|------|--------------------------------|
| POST   | `/lock`       | ✓    | Lock seats (10 min window)     |
| POST   | `/confirm`    | ✓    | Confirm booking after payment  |
| GET    | `/my`         | ✓    | My booking history             |
| GET    | `/:id`        | ✓    | Booking details                |
| PATCH  | `/:id/cancel` | ✓    | Cancel booking                 |

Full interactive docs: **`http://localhost:5000/api-docs`**

---

## Booking Flow

```
1. Browse shows      →  GET /api/shows?city=karachi&date=2025-05-01
2. View seat map     →  GET /api/shows/:id/seats
3. Lock seats        →  POST /api/bookings/lock        (10 min timer starts)
4. Pay externally
5. Confirm booking   →  POST /api/bookings/confirm     (pass paymentId if you have one)
6. Get ticket        →  GET /api/bookings/:id
```

If the user doesn't confirm within 10 minutes, the locks expire automatically and the seats go back to available.

---

## How Double Booking is Prevented

Seat locking uses a single atomic `updateMany` with a `{ status: "available" }` filter. MongoDB guarantees document-level atomicity — if two users try to lock the same seat simultaneously, only one will have a `modifiedCount` match. The other gets a 409 and their partial locks are immediately rolled back.

Booking confirmation uses a MongoDB transaction to ensure the booking document, seat status updates, and available seat counter all succeed together or not at all.

---

## Roles

| Role     | Can do                                      |
|----------|---------------------------------------------|
| customer | Browse, book, view own bookings, cancel     |
| admin    | Everything above + manage movies/theaters/shows |

Set a user's role to `admin` directly in MongoDB — registration only allows `customer` or `seller`.

---

## Deployment (Vercel)

1. Push your code to GitHub
2. Connect the repo on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env` in the Vercel project settings
4. Deploy — Vercel uses `vercel.json` to route all traffic to `server.js`

> Note: The stale lock cleanup job (`setInterval`) is disabled in production since Vercel is serverless. For production, replace it with a Vercel Cron Job or an external scheduler.

---

## Project Structure

```
src/
├── common/
│   ├── config/       db.js, email.js, swagger.js
│   ├── dto/          base.dto.js
│   ├── middleware/   validate.middleware.js
│   └── utils/        api-error.js, api-response.js, jwt.utils.js, lock-cleanup.js
└── modules/
    ├── auth/         model, service, controller, routes, dto
    ├── movie/
    ├── theater/      (includes screen model)
    ├── show/         (includes show-seat model)
    └── booking/
```

---

## Developer Notes

Built this for a hackathon in a single session. The trickiest part was the seat locking — went through a few approaches before settling on atomic `updateMany` with a modifiedCount check. Transactions are used only for confirmation and cancellation where multiple collections need to stay in sync.

The `ShowSeat` collection is intentionally separate from `Show` — embedding 200+ seats in a single document would make atomic per-seat updates unreliable under concurrent load.

If you're extending this: the payment flow is stubbed — just pass a `paymentId` string to `/confirm`. Wire a real gateway (Stripe, PayFast) by calling it between `/lock` and `/confirm`.
