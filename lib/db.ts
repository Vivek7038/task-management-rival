import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const createPrismaClient = () => {
  if (process.env.DATABASE_URL?.includes("neon.tech")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require("@prisma/adapter-neon");
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
    return new PrismaClient({ adapter });
  }
  // Standard TCP for local/Docker Postgres — do NOT import PrismaNeon here,
  // its module-level side effects register a global WebSocket handler that
  // breaks plain TCP connections even when the adapter isn't used.
  return new PrismaClient();
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
