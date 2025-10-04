import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import path from 'path'

// Carregar variáveis de ambiente do arquivo .env na raiz do projeto
config({ path: path.resolve(process.cwd(), '.env') })

// Garantir que DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./db/custom.db'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db