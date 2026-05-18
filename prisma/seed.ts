import { PrismaClient } from './client/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from '@better-auth/utils/password'
import crypto from 'crypto'

const connectionString = process.env.DATABASE_URL
if (!connectionString) { console.error('DATABASE_URL is required'); process.exit(1) }

const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Administrateur'
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD are required in .env.local')
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  const count = await prisma.user.count()
  if (count > 0) {
    console.log('Users already exist, skipping seed')
    return
  }

  const hashed = await hashPassword(ADMIN_PASSWORD)

  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      role: 'admin',
      emailVerified: true,
    },
  })

  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: hashed,
    },
  })

  console.log('Admin user created:', user.email)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
