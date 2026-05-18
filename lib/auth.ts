import { betterAuth } from 'better-auth'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { admin } from 'better-auth/plugins/admin'
import { prisma } from './prisma'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://192.168.1.31:3000',
    'http://192.168.1.31:3001',
    'https://localhost:3443',
    'https://192.168.1.31:3443',
    'https://10.183.117.15:3443',
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS
      ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',')
      : []),
    ...(process.env.NEXT_PUBLIC_APP_URL
      ? [process.env.NEXT_PUBLIC_APP_URL]
      : []),
  ],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
    usePlural: false,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [
    admin({
      defaultRole: 'caissier',
      adminRoles: ['admin'],
    }),
  ],
})
