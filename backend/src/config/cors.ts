// Daftar origin yang diizinkan untuk CORS (HTTP + Socket.IO).
// Dibaca dari env CORS_ORIGINS (comma-separated); default origin dev Vite.
// File ini satu-satunya sumber allowlist — app.ts & websocket/socket.ts memakainya.
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export default CORS_ORIGINS;
