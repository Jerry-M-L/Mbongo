export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { hashPassword } from 'better-auth/crypto'

export async function GET() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminName = process.env.ADMIN_NAME ?? 'Administrateur'

  if (!adminEmail || !adminPassword) {
    return Response.json({ setup: false, message: 'ADMIN_EMAIL et ADMIN_PASSWORD requis dans .env.local' }, { status: 500 })
  }

  try {
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      return Response.json({ setup: false, message: 'Déjà initialisé' })
    }

    const hashed = await hashPassword(adminPassword)

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: adminName,
        email: adminEmail,
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

    return Response.json({ setup: true, message: 'Admin créé avec succès' })
  } catch (error) {
    console.error('Setup error:', error)
    return Response.json({ setup: false, message: "Erreur lors de l'initialisation" }, { status: 500 })
  }
}
