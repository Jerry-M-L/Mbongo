'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSales, getExpenses, getProducts, formatCFA } from '@/lib/store'
import type { Sale, Expense, Product } from '@/lib/types'
import {
  TrendingUp, TrendingDown, ShoppingCart, Wallet, Package,
  BarChart2, Trophy, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PERIODS = [
  { value: 'week', label: '7 jours' },
  { value: 'month', label: 'Ce mois' },
  { value: 'year', label: 'Cette année' },
] as const

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces', mobile: 'Mobile Money', card: 'Carte', credit: 'Crédit',
}
const PAYMENT_COLORS: Record<string, { bar: string; dot: string }> = {
  cash: { bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  mobile: { bar: 'bg-violet-500', dot: 'bg-violet-500' },
  card: { bar: 'bg-sky-500', dot: 'bg-sky-500' },
  credit: { bar: 'bg-amber-500', dot: 'bg-amber-500' },
}
const MEDALS = ['bg-amber-400 text-white', 'bg-slate-300 text-white', 'bg-orange-300 text-white']

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => { setSales(getSales()); setExpenses(getExpenses()); setProducts(getProducts()) }, [])

  const getRange = () => {
    const now = new Date()
    if (period === 'week') return { start: new Date(now.getTime() - 7 * 86400000), end: now }
    if (period === 'month') return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now }
    return { start: new Date(now.getFullYear(), 0, 1), end: now }
  }

  const { start, end } = getRange()
  const fSales = sales.filter(s => { const d = new Date(s.createdAt); return d >= start && d <= end })
  const fExp = expenses.filter(e => { const d = new Date(e.createdAt); return d >= start && d <= end })

  const totalSales = fSales.reduce((s, x) => s + x.total, 0)
  const totalExp = fExp.reduce((s, x) => s + x.amount, 0)
  const avgSale = fSales.length ? totalSales / fSales.length : 0
  const cogs = fSales.reduce((s, sale) => s + sale.items.reduce((is, item) => {
    const p = products.find(x => x.id === item.productId)
    return is + (p ? p.purchasePrice * item.quantity : 0)
  }, 0), 0)
  const grossProfit = totalSales - cogs
  const netProfit = grossProfit - totalExp
  const grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0
  const totalItems = fSales.reduce((s, x) => s + x.items.reduce((is, i) => is + i.quantity, 0), 0)

  const byPayment = fSales.reduce((acc, s) => { acc[s.paymentMethod] = (acc[s.paymentMethod] ?? 0) + s.total; return acc }, {} as Record<string, number>)

  const productMap: Record<string, { name: string; qty: number; rev: number }> = {}
  fSales.forEach(s => s.items.forEach(i => {
    if (!productMap[i.productId]) productMap[i.productId] = { name: i.productName, qty: 0, rev: 0 }
    productMap[i.productId].qty += i.quantity
    productMap[i.productId].rev += i.total
  }))
  const topProducts = Object.values(productMap).sort((a, b) => b.rev - a.rev).slice(0, 5)

  const byExpCat = fExp.reduce((acc, e) => { acc[e.category] = (acc[e.category] ?? 0) + e.amount; return acc }, {} as Record<string, number>)

  // Daily bars (last 14 days with data or all in week/month)
  const dailyData: { date: string; label: string; sales: number; expenses: number }[] = []
  const cur = new Date(start)
  while (cur <= end) {
    const ds = cur.toDateString()
    const sv = fSales.filter(s => new Date(s.createdAt).toDateString() === ds).reduce((s, x) => s + x.total, 0)
    const ev = fExp.filter(e => new Date(e.createdAt).toDateString() === ds).reduce((s, x) => s + x.amount, 0)
    dailyData.push({ date: ds, label: cur.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), sales: sv, expenses: ev })
    cur.setDate(cur.getDate() + 1)
  }
  const visible = period === 'year' ? dailyData.filter(d => d.sales > 0 || d.expenses > 0).slice(-20) : dailyData.slice(-14)
  const maxBar = Math.max(...visible.map(d => Math.max(d.sales, d.expenses)), 1)

  return (
    <div className="space-y-4">
      {/* Header + period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Rapports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Analyses de performance</p>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg self-start sm:self-auto">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={cn('px-3 py-1.5 rounded-md text-xs font-semibold transition-all', period === p.value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Chiffre d'affaires", value: formatCFA(totalSales), sub: `${fSales.length} ventes`, icon: ShoppingCart, green: true },
          { label: 'Dépenses totales', value: formatCFA(totalExp), sub: `${fExp.length} entrées`, icon: TrendingDown, green: false },
          { label: 'Bénéfice brut', value: formatCFA(grossProfit), sub: `Marge ${grossMargin.toFixed(1)}%`, icon: BarChart2, green: grossProfit >= 0 },
          { label: 'Bénéfice net', value: formatCFA(netProfit), sub: 'Après charges', icon: TrendingUp, green: netProfit >= 0 },
        ].map(({ label, value, sub, icon: Icon, green }) => (
          <Card key={label} className="border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-tight">{label}</p>
                <Icon className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
              </div>
              <p className={cn('text-xl font-bold tracking-tight', !green && 'text-rose-600', label === 'Bénéfice net' && netProfit >= 0 && 'text-emerald-600')}>
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Vertical bar chart */}
        <Card className="border shadow-none">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Évolution journalière
            </CardTitle>
            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-primary inline-block" />Ventes</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-400 inline-block" />Dépenses</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <BarChart2 className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-sm">Aucune donnée</p>
              </div>
            ) : (
              <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">
                {visible.map((d, i) => {
                  const isToday = d.date === new Date().toDateString()
                  const sh = maxBar > 0 ? (d.sales / maxBar) * 100 : 0
                  const eh = maxBar > 0 ? (d.expenses / maxBar) * 100 : 0
                  return (
                    <div key={d.date} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: visible.length > 10 ? '20px' : '28px' }} title={`${d.label}\nVentes: ${formatCFA(d.sales)}\nDépenses: ${formatCFA(d.expenses)}`}>
                      <div className="flex items-end gap-0.5 h-24 w-full">
                        <div className={cn('flex-1 rounded-t-sm transition-all', isToday ? 'bg-primary' : 'bg-primary/30')}
                          style={{ height: `${Math.max(sh, 2)}%` }} />
                        <div className={cn('flex-1 rounded-t-sm transition-all', isToday ? 'bg-rose-500' : 'bg-rose-300')}
                          style={{ height: `${Math.max(eh, 2)}%` }} />
                      </div>
                      <span className={cn('text-[9px] font-medium', isToday ? 'text-primary' : 'text-muted-foreground')}>
                        {d.label.split(' ')[0]}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment methods */}
        <Card className="border shadow-none">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              Modes de paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {Object.keys(byPayment).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Wallet className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-sm">Aucune vente</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {Object.entries(byPayment).sort(([, a], [, b]) => b - a).map(([m, amt]) => {
                  const pct = totalSales > 0 ? (amt / totalSales) * 100 : 0
                  const colors = PAYMENT_COLORS[m] ?? { bar: 'bg-slate-400', dot: 'bg-slate-400' }
                  return (
                    <div key={m}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full', colors.dot)} />
                          <span className="text-sm font-medium">{PAYMENT_LABELS[m] ?? m}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold">{formatCFA(amt)}</span>
                          <span className="text-xs text-muted-foreground ml-2">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', colors.bar)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top products */}
        <Card className="border shadow-none">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Top produits
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Package className="w-7 h-7 opacity-20 mb-2" />
                <p className="text-sm">Aucune vente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topProducts.map((p, i) => {
                  const barW = topProducts[0].rev > 0 ? (p.rev / topProducts[0].rev) * 100 : 0
                  return (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className={cn('w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0', MEDALS[i] ?? 'bg-muted text-muted-foreground')}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <p className="text-sm font-semibold truncate">{p.name}</p>
                          <p className="text-sm font-bold ml-2 flex-shrink-0">{formatCFA(p.rev)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary/50 rounded-full" style={{ width: `${barW}%` }} />
                          </div>
                          <span className="text-[11px] text-muted-foreground flex-shrink-0">{p.qty} vendus</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by category */}
        <Card className="border shadow-none">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              Dépenses par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {Object.keys(byExpCat).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <TrendingDown className="w-7 h-7 opacity-20 mb-2" />
                <p className="text-sm">Aucune dépense</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(byExpCat).sort(([, a], [, b]) => b - a).map(([cat, amt]) => {
                  const pct = totalExp > 0 ? (amt / totalExp) * 100 : 0
                  return (
                    <div key={cat}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{cat}</span>
                        <div>
                          <span className="text-sm font-bold text-rose-600">{formatCFA(amt)}</span>
                          <span className="text-xs text-muted-foreground ml-2">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-rose-400/70 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Vente moyenne', value: formatCFA(avgSale), icon: ArrowUpRight },
          { label: 'Coût marchandises', value: formatCFA(cogs), icon: ArrowDownRight },
          { label: 'Transactions', value: String(fSales.length), icon: ShoppingCart },
          { label: 'Articles vendus', value: String(totalItems), icon: Package },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-3.5 bg-card border border-border rounded-xl">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold tracking-tight mt-0.5">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
