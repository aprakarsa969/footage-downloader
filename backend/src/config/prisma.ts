// Instance tunggal Prisma Client, dipakai semua repository.
// Prisma membaca DATABASE_URL dari .env.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
