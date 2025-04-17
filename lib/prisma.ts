import { PrismaClient } from "@prisma/client";

// グローバルスコープでPrismaClientのインスタンスを保持
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 開発環境での重複インスタンス化を防ぐ
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
