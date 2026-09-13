import { PrismaClient } from '@prisma/client'

const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_blG25BAdTIvr@ep-restless-queen-ax47btno.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: dbUrl
      }
    }
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
