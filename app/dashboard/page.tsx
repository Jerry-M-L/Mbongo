'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getProducts, getSales, getExpenses, getCustomers,
  getOpenCashRegister, openCashRegister, closeCashRegister, formatCFA,
} from '@/lib/store'
import { useAuth } from '@/lib/auth-context'
import type { CashRegister, Sale, Product } from '@/lib/types'
import {
  TrendingUp, TrendingDown, Package, Users, AlertTriangle,
  Wallet, ShoppingCart, Plus, Lock, ArrowRight,
  ReceiptText, Banknote, Zap,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Espèces', mobile: 'Mobile Money', card: 'Carte', credit: 'Crédit',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function pct(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null)
  const [showOpenDialog, setShowOpenDialog] = useState(false)
  const [openingBalance, setOpeningBalance] = useState('')

  // Computed state
  const [data, setData] = useState({
    todaySales: 0, yesterdaySales: 0,
    todayExpenses: 0, yesterdayExpenses: 0,
    todayProfit: 0,
    totalProducts: 0, lowStockProducts: 0, totalCustomers: 0,
    cashInRegister: 0,
    recentSales: [] as Sale[],
    topProducts: [] as { name: string; qty: number; revenue: number }[],
    weekBars: [] as { label: string; sales: number; expenses: number }[],
    txCount: 0,
  })

  const loadData = () => {
    const products = getProducts()
    const sales = getSales()
    const expenses = getExpenses()
    const customers = getCustomers()
    const register = getOpenCashRegister()

    const today = new Date()
    const todayStr = today.toDateString()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()

    const ts = sales.filter((s) => new Date(s.createdAt).toDateString() === todayStr)
    const ys = sales.filter((s) => new Date(s.createdAt).toDateString() === yesterdayStr)
    const te = expenses.filter((e) => new Date(e.createdAt).toDateString() === todayStr)
    const ye = expenses.filter((e) => new Date(e.createdAt).toDateString() === yesterdayStr)

    const tsTotal = ts.reduce((s, x) => s + x.total, 0)
    const ysTotal = ys.reduce((s, x) => s + x.total, 0)
    const teTotal = te.reduce((s, x) => s + x.amount, 0)
    const yeTotal = ye.reduce((s, x) => s + x.amount, 0)

    // Top products today
    const prodMap: Record<string, { name: string; qty: number; revenue: number }> = {}
    ts.forEach((sale) => sale.items.forEach((item) => {
      if (!prodMap[item.productId]) prodMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 }
      prodMap[item.productId].qty += item.quantity
      prodMap[item.productId].revenue += item.total
    }))
    const topProducts = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 4)

    // 7-day bars
    const weekBars = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(today.getDate() - (6 - i))
      const ds = d.toDateString()
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short' })
      const sv = sales.filter((s) => new Date(s.createdAt).toDateString() === ds).reduce((s, x) => s + x.total, 0)
      const ev = expenses.filter((e) => new Date(e.createdAt).toDateString() === ds).reduce((s, x) => s + x.amount, 0)
      return { label, sales: sv, expenses: ev }
    })

    setCashRegister(register)
    setData({
      todaySales: tsTotal, yesterdaySales: ysTotal,
      todayExpenses: teTotal, yesterdayExpenses: yeTotal,
      todayProfit: tsTotal - teTotal,
      totalProducts: products.length,
      lowStockProducts: products.filter((p) => p.quantity <= p.minStock).length,
      totalCustomers: customers.length,
      cashInRegister: register ? register.openingBalance + tsTotal - teTotal : 0,
      recentSales: sales.slice(-6).reverse(),
      topProducts,
      weekBars,
      txCount: ts.length,
    })
  }

  useEffect(() => { loadData() }, [])

  const handleOpen = () => {
    if (!user || !openingBalance) return
    openCashRegister(Number(openingBalance), user.id, user.name)
    setShowOpenDialog(false); setOpeningBalance(''); loadData()
  }

  const salesPct = pct(data.todaySales, data.yesterdaySales)
  const maxBar = Math.max(...data.weekBars.map((b) => Math.max(b.sales, b.expenses)), 1)

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {!cashRegister ? (
          <Button size="sm" onClick={() => setShowOpenDialog(true)} className="gap-2 self-start sm:self-auto">
            <Banknote className="w-3.5 h-3.5" />
            Ouvrir la caisse
          </Button>
        ) : (
          <Button size="sm" variant="outline"
            onClick={() => { closeCashRegister(cashRegister.id); loadData() }}
            className="gap-2 self-start sm:self-auto text-destructive border-destructive/20 hover:bg-destructive/5">
            <Lock className="w-3.5 h-3.5" />
            Fermer la caisse
          </Button>
        )}
      </div>

      {/* ── Caisse banner ──────────────────────── */}
      {cashRegister ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span className="text-emerald-800 font-medium">Caisse ouverte</span>
          <span className="text-emerald-600">depuis {new Date(cashRegister.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {cashRegister.userName}</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-emerald-600">Fond : {formatCFA(cashRegister.openingBalance)}</span>
            <Link href="/dashboard/pos">
              <Button size="sm" className="h-7 text-xs gap-1.5">
                <Zap className="w-3 h-3" />
                Ouvrir la caisse (POS)
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/60 border border-border text-sm">
          <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">La caisse est fermée — ouvrez-la pour commencer les ventes</span>
          <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={() => setShowOpenDialog(true)}>
            Ouvrir
          </Button>
        </div>
      )}

      {/* ── Quick actions ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Point de vente', icon: ShoppingCart, href: '/dashboard/pos', primary: true },
          { label: 'Nouveau produit', icon: Package, href: '/dashboard/stock' },
          { label: 'Dépense', icon: TrendingDown, href: '/dashboard/expenses' },
          { label: 'Rapports', icon: ReceiptText, href: '/dashboard/reports' },
        ].map(({ label, icon: Icon, href, primary }) => (
          <Link key={label} href={href}>
            <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-all hover:shadow-sm active:scale-95 ${primary ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/30 hover:bg-primary/5'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── KPI cards ─────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Ventes du jour', value: data.todaySales,
            sub: `${data.txCount} transaction${data.txCount > 1 ? 's' : ''}`,
            trend: salesPct, icon: ShoppingCart,
          },
          {
            label: 'Dépenses', value: data.todayExpenses,
            sub: `Hier : ${formatCFA(data.yesterdayExpenses)}`,
            trend: null, icon: TrendingDown, neg: true,
          },
          {
            label: 'Bénéfice net', value: data.todayProfit,
            sub: data.todayProfit >= 0 ? 'Positif' : 'Négatif',
            trend: null, icon: TrendingUp, profit: true,
          },
          {
            label: 'Solde caisse', value: data.cashInRegister,
            sub: cashRegister ? 'Caisse ouverte' : 'Caisse fermée',
            trend: null, icon: Wallet,
          },
        ].map(({ label, value, sub, trend, icon: Icon, neg, profit }) => (
          <Card key={label} className="border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                <Icon className="w-3.5 h-3.5 text-muted-foreground/40 mt-0.5" />
              </div>
              <p className={`text-2xl font-bold tracking-tight leading-none ${profit && value < 0 ? 'text-destructive' : profit && value >= 0 ? 'text-emerald-600' : ''}`}>
                {formatCFA(value)}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{sub}</span>
                {trend !== null && (
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-sm ${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {trend >= 0 ? '+' : ''}{trend}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Middle row ────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-3">

        {/* Stock & clients */}
        <div className="space-y-3">
          {[
            { label: 'Produits en stock', value: data.totalProducts, icon: Package, warn: false },
            { label: 'Alertes stock faible', value: data.lowStockProducts, icon: AlertTriangle, warn: data.lowStockProducts > 0 },
            { label: 'Clients enregistrés', value: data.totalCustomers, icon: Users, warn: false },
          ].map(({ label, value, icon: Icon, warn }) => (
            <Card key={label} className={`border shadow-none ${warn ? 'border-amber-200 bg-amber-50/40' : ''}`}>
              <CardContent className="px-4 py-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${warn ? 'bg-amber-100' : 'bg-muted'}`}>
                  <Icon className={`w-4 h-4 ${warn ? 'text-amber-600' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xl font-extrabold tracking-tight leading-none ${warn ? 'text-amber-700' : ''}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
                </div>
                {warn && value > 0 && (
                  <Link href="/dashboard/stock">
                    <ArrowRight className="w-4 h-4 text-amber-500" />
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 7-day mini chart */}
        <Card className="border shadow-none">
          <CardHeader className="px-4 py-3 border-b pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">7 derniers jours</CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-4">
            <div className="flex items-end gap-1.5 h-28">
              {data.weekBars.map((bar, i) => {
                const isToday = i === 6
                const sH = maxBar > 0 ? (bar.sales / maxBar) * 100 : 0
                const eH = maxBar > 0 ? (bar.expenses / maxBar) * 100 : 0
                return (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-0.5 h-20">
                      <div
                        className={`flex-1 rounded-t-sm transition-all ${isToday ? 'bg-primary' : 'bg-primary/20'}`}
                        style={{ height: `${Math.max(sH, 2)}%` }}
                        title={`Ventes: ${formatCFA(bar.sales)}`}
                      />
                      <div
                        className={`flex-1 rounded-t-sm transition-all ${isToday ? 'bg-rose-400' : 'bg-rose-200'}`}
                        style={{ height: `${Math.max(eH, 2)}%` }}
                        title={`Dépenses: ${formatCFA(bar.expenses)}`}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {bar.label}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 mt-3 pt-3 border-t">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />Ventes
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />Dépenses
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top produits du jour */}
        <Card className="border shadow-none">
          <CardHeader className="px-4 py-3 border-b">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Top produits aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Package className="w-7 h-7 mb-1.5 opacity-20" />
                <p className="text-xs">Aucune vente aujourd'hui</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.topProducts.map((p, i) => {
                  const maxRev = data.topProducts[0].revenue
                  const barW = maxRev > 0 ? (p.revenue / maxRev) * 100 : 0
                  return (
                    <div key={p.name} className="px-4 py-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground/50 w-4 flex-shrink-0">#{i + 1}</span>
                          <span className="text-sm font-medium truncate">{p.name}</span>
                        </div>
                        <span className="text-sm font-bold ml-2 flex-shrink-0">{formatCFA(p.revenue)}</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/50 rounded-full" style={{ width: `${barW}%` }} />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{p.qty} unité(s)</p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Dernières ventes ─────────────────── */}
      <Card className="border shadow-none">
        <CardHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dernières ventes
            </CardTitle>
            <Link href="/dashboard/invoices">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary px-2">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <ShoppingCart className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">Aucune vente enregistrée</p>
              <Link href="/dashboard/pos" className="mt-3">
                <Button size="sm" variant="outline" className="text-xs gap-1.5">
                  <Zap className="w-3 h-3" />
                  Aller à la caisse
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center px-4 py-3 gap-3 hover:bg-muted/30 transition-colors">
                  <div className="w-7 h-7 rounded-md bg-primary/8 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold font-mono truncate">{sale.invoiceNumber}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">{sale.items.length} art.</span>
                      <span className="text-muted-foreground/40">·</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded-sm font-medium">
                        {PAYMENT_LABEL[sale.paymentMethod]}
                      </Badge>
                      {sale.customerName && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[80px]">{sale.customerName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">{formatCFA(sale.total)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog ouverture caisse ──────────── */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Banknote className="w-4 h-4 text-primary" />
              Ouvrir la caisse
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <Label className="text-sm font-medium">Fond de départ (FCFA)</Label>
            <Input
              type="number" placeholder="Ex: 50 000"
              value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)}
              className="h-11 text-lg font-semibold" autoFocus
            />
            {openingBalance && (
              <p className="text-sm font-semibold text-primary pl-1">{formatCFA(Number(openingBalance))}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowOpenDialog(false)}>Annuler</Button>
            <Button size="sm" onClick={handleOpen} disabled={!openingBalance}>Ouvrir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
