# Syncly Backend

Production-ready backend for real-time chat and file sharing.

## Stack

- Node.js + Express
- Socket.io
- MongoDB + Mongoose
- JWT auth
- Multer uploads

## Project Structure

src/

- config/
- controllers/
- middleware/
- models/
- routes/
- sockets/
- utils/
- server.js

## Setup

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies.
3. Run development server.

```bash
npm install
npm run dev
```

## REST API

- `POST /auth/login`
- `GET /user/me`
- `PATCH /user/me`
- `GET /users?search=`
- `GET /messages/:userId`
- `POST /upload` (multipart form with field `file`)
- `GET /generate-qr`
- `POST /connect-device`

Both root and `/api` prefixes are supported.

## Socket.io Events

Client -> Server:

- `join`
- `send_message`
- `typing`
- `stop_typing`

Server -> Client:

- `receive_message`
- `message_sent`
- `typing`
- `stop_typing`
- `presence_update`
- `device_connected`

### Socket Auth

Send JWT token in one of these:

- `handshake.auth.token`
- `Authorization: Bearer <token>` header

## Notes

- CORS is open for local network development (`origin: true`).
- Server binds to `0.0.0.0` for LAN access.
- Uploaded files are served from `/uploads/<filename>`.
- Google token verification runs in mock mode when `GOOGLE_CLIENT_ID` is not set.
