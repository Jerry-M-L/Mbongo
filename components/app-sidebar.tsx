'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard, ShoppingCart, Boxes, ArrowDownCircle,
  BarChart2, FileText, UsersRound, Settings2, LogOut,
  UserCog, ChevronRight, PanelLeftClose, PanelLeftOpen,
  MoreHorizontal, X, ChevronUp,
} from 'lucide-react'
import { useState, useEffect, useLayoutEffect } from 'react'

const mainNav = [
  { name: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Caisse', href: '/dashboard/pos', icon: ShoppingCart },
  { name: 'Stock', href: '/dashboard/stock', icon: Boxes },
  { name: 'Rapports', href: '/dashboard/reports', icon: BarChart2 },
]

const moreNav = [
  { name: 'Dépenses', href: '/dashboard/expenses', icon: ArrowDownCircle },
  { name: 'Factures', href: '/dashboard/invoices', icon: FileText },
  { name: 'Clients', href: '/dashboard/customers', icon: UsersRound },
]

const adminNav = [
  { name: 'Utilisateurs', href: '/dashboard/users', icon: UserCog },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings2 },
]

const allDesktopNav = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Point de vente', href: '/dashboard/pos', icon: ShoppingCart },
  { name: 'Stock', href: '/dashboard/stock', icon: Boxes },
  { name: 'Dépenses', href: '/dashboard/expenses', icon: ArrowDownCircle },
  { name: 'Rapports', href: '/dashboard/reports', icon: BarChart2 },
  { name: 'Factures', href: '/dashboard/invoices', icon: FileText },
  { name: 'Clients', href: '/dashboard/customers', icon: UsersRound },
]

const roleLabel: Record<string, string> = {
  admin: 'Administrateur', caissier: 'Caissier', gestionnaire: 'Gestionnaire',
}

/* ─── Desktop sidebar ──────────────────────────────────────────── */
function DesktopSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [ready, setReady] = useState(false)

  // useLayoutEffect s'exécute avant le paint — pas de flash ni d'animation au chargement
  useLayoutEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
    setReady(true)
  }, [])

  const toggle = () => setCollapsed((p) => {
    localStorage.setItem('sidebar-collapsed', String(!p))
    return !p
  })

  const NavLink = ({ item }: { item: typeof allDesktopNav[0] }) => {
    const isActive = pathname === item.href
    return (
      <Link
        href={item.href}
        title={collapsed ? item.name : undefined}
        className={cn(
          'group flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all',
          collapsed ? 'justify-center px-2' : 'px-3',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
        )}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.name}</span>
            {isActive && <ChevronRight className="w-3 h-3 opacity-60 flex-shrink-0" />}
          </>
        )}
      </Link>
    )
  }

  const sidebarWidth = collapsed ? 'w-[60px]' : 'w-60'
  const transitionCls = ready ? 'transition-[width] duration-200' : ''

  return (
    <>
    {/* Spacer en flux normal — pousse le contenu à droite */}
    <div className={cn('hidden lg:block flex-shrink-0', sidebarWidth, transitionCls)} aria-hidden />

    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen fixed top-0 left-0 z-30 overflow-hidden',
        transitionCls,
        sidebarWidth,
      )}
      style={{ background: 'var(--sidebar)' }}
    >
      {/* Logo */}
      <div className={cn(
        'border-b border-sidebar-border flex items-center',
        collapsed ? 'px-2 py-4 justify-center' : 'px-4 py-5 justify-between'
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-black text-sm">M</span>
            </div>
            <div>
              <p className="font-bold text-sidebar-foreground text-[15px] tracking-tight leading-none">Mbongo</p>
              <p className="text-[10px] mt-0.5 font-medium tracking-widest uppercase" style={{ color: 'oklch(0.55 0.06 58)' }}>
                Gestion de boutique
              </p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-black text-sm">M</span>
          </div>
        )}
        <button
          onClick={toggle}
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav — min-h-0 est requis pour que overflow-y-auto fonctionne en flex */}
      <nav className={cn('flex-1 min-h-0 py-3 space-y-0.5 overflow-y-auto scrollbar-thin', collapsed ? 'px-1.5' : 'px-2')}>
        {allDesktopNav.map((item) => <NavLink key={item.href} item={item} />)}
        {user?.role === 'admin' && (
          <>
            {!collapsed
              ? <div className="pt-4 pb-1.5 px-3"><p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'oklch(0.40 0.03 55)' }}>Admin</p></div>
              : <div className="my-2 border-t border-sidebar-border mx-1" />
            }
            {adminNav.map((item) => <NavLink key={item.href} item={item} />)}
          </>
        )}
      </nav>

      {/* User + logout — flex-shrink-0 prevents nav from pushing this out of view */}
      <div className={cn('flex-shrink-0 border-t border-sidebar-border', collapsed ? 'p-2' : 'p-3')}>
        {collapsed ? (
          <button
            onClick={async () => { await logout() }}
            title="Déconnexion"
            className="w-full flex items-center justify-center py-2 rounded-lg text-sidebar-foreground/70 hover:text-rose-400 hover:bg-sidebar-accent transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-sidebar-accent/50 transition-all group">
            <div className="w-8 h-8 rounded-lg bg-primary/25 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold" style={{ color: 'oklch(0.72 0.12 58)' }}>
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">{user?.name}</p>
              <p className="text-[11px] mt-0.5 text-sidebar-foreground/50">{roleLabel[user?.role ?? ''] ?? user?.role}</p>
            </div>
            <button
              onClick={async () => { await logout() }}
              title="Déconnexion"
              className="w-7 h-7 flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  )
}

/* ─── Mobile bottom nav ────────────────────────────────────────── */
function MobileNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [sheetOpen, setSheetOpen] = useState(false)

  const isMore = [...moreNav, ...adminNav].some((i) => i.href === pathname)

  return (
    <>
      {/* Bottom nav bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border"
        style={{ background: 'var(--sidebar)' }}>
        <div className="flex items-stretch h-16">
          {mainNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-all active:scale-95',
                  isActive
                    ? 'text-primary'
                    : 'text-sidebar-foreground/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                <span>{item.name}</span>
              </Link>
            )
          })}

          {/* Plus button */}
          <button
            onClick={() => setSheetOpen(true)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-all active:scale-95',
              isMore ? 'text-primary' : 'text-sidebar-foreground/50 hover:text-sidebar-foreground'
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>Plus</span>
          </button>
        </div>
      </nav>

      {/* Bottom sheet overlay */}
      {sheetOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl transition-transform duration-300',
        sheetOpen ? 'translate-y-0' : 'translate-y-full'
      )} style={{ background: 'var(--sidebar)' }}>

        {/* Handle + close */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="w-8 h-1 rounded-full bg-sidebar-border mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <div className="flex items-center gap-2.5 pt-2">
            <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold" style={{ color: 'oklch(0.70 0.10 58)' }}>
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">{user?.name}</p>
              <p className="text-[11px]" style={{ color: 'oklch(0.45 0.025 55)' }}>{roleLabel[user?.role ?? ''] ?? user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => setSheetOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground mt-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sheet nav items */}
        <div className="px-3 pb-3 space-y-0.5">
          {moreNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSheetOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
              </Link>
            )
          })}

          {user?.role === 'admin' && (
            <>
              <div className="pt-2 pb-1 px-3">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'oklch(0.40 0.03 55)' }}>Admin</p>
              </div>
              {adminNav.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
                  </Link>
                )
              })}
            </>
          )}

          <div className="pt-1">
            <button
              onClick={async () => { await logout(); setSheetOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-medium text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all active:scale-[0.98]"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Safe area spacer */}
        <div className="h-safe-bottom pb-2" />
      </div>
    </>
  )
}

/* ─── Export ───────────────────────────────────────────────────── */
export function AppSidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileNav />
    </>
  )
}
