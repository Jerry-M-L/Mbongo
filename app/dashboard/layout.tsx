'use client'

import { useAuth } from '@/lib/auth-context'
import { LoginForm } from '@/components/login-form'
import { AppSidebar } from '@/components/app-sidebar'
import type { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'oklch(0.975 0.003 247)' }}>
      <AppSidebar />
      <main
        className="flex-1 min-w-0 p-4 lg:p-6 pt-4 lg:pt-6 pb-20 lg:pb-6 flex flex-col"
        style={{ scrollbarGutter: 'stable' }}
      >
        {children}
      </main>
    </div>
  )
}
