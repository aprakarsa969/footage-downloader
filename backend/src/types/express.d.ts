// Perluasan tipe Express: setelah authMiddleware jalan, `req.user.id` tersedia.
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export {};
