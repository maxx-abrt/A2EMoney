import { PrismaClient } from "@prisma/client"
import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"

// Configure neon for serverless environment
neonConfig.fetchConnectionCache = true

// Create Prisma client with Neon adapter for serverless
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }
  
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  })
  
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Export types for use in API routes
export * from "@prisma/client"
