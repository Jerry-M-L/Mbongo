'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getSales, getStoreInfo, formatCFA } from '@/lib/store'
import type { Sale, StoreInfo } from '@/lib/types'
import {
  Search, FileText, Printer, Eye, Receipt, TrendingUp,
  Hash, X, Banknote, Smartphone, CreditCard, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces', mobile: 'Mobile Money', card: 'Carte', credit: 'Crédit',
}
const PAYMENT_COLORS: Record<string, string> = {
  cash: 'bg-emerald-100 text-emerald-700',
  mobile: 'bg-violet-100 text-violet-700',
  card: 'bg-sky-100 text-sky-700',
  credit: 'bg-amber-100 text-amber-700',
}
const PAYMENT_ICONS: Record<string, React.ElementType> = {
  cash: Banknote, mobile: Smartphone, card: CreditCard, credit: AlertCircle,
}

const PERIODS = [
  { value: 'all', label: 'Tout' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: '7 jours' },
  { value: 'month', label: 'Ce mois' },
]

/* ─── Print function ──────────────────────────────────────────── */
function printInvoice(sale: Sale, storeInfo: StoreInfo) {
  const discountRow = sale.discount > 0
    ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:#e11d48;">Remise</span><span style="color:#e11d48;font-weight:600;">−${formatCFA(sale.discount)}</span></div>`
    : ''

  const customerSection = sale.customerName
    ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin-bottom:20px;">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin:0 0 4px;">Client</p>
        <p style="font-size:14px;font-weight:600;margin:0;color:#0f172a;">${sale.customerName}</p>
      </div>`
    : ''

  const itemRows = sale.items.map((item) => `
    <tr>
      <td style="padding:10px 12px;font-size:13px;font-weight:500;color:#0f172a;border-bottom:1px solid #f1f5f9;">${item.productName}</td>
      <td style="padding:10px 12px;text-align:right;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;">${formatCFA(item.unitPrice)}</td>
      <td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;">${item.quantity}</td>
      <td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9;">${formatCFA(item.total)}</td>
    </tr>`).join('')

  const date = new Date(sale.createdAt)
  const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Facture ${sale.invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background: #fff;
      color: #0f172a;
      padding: 40px;
      max-width: 720px;
      margin: 0 auto;
    }
    @media print {
      body { padding: 24px; }
      @page { margin: 1.5cm; size: A4; }
    }
  </style>
</head>
<body>
  <div style="display:flex;align-items:center;gap:12px;padding-bottom:24px;border-bottom:2px solid #b45309;margin-bottom:28px;">
    <div style="width:40px;height:40px;background:#b45309;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <span style="color:white;font-weight:900;font-size:18px;">M</span>
    </div>
    <div>
      <p style="font-size:18px;font-weight:800;color:#0f172a;line-height:1;">${storeInfo.name}</p>
      <p style="font-size:11px;font-weight:600;color:#b45309;letter-spacing:.05em;margin-top:2px;">Mbongo — Gestion de boutique</p>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:24px;">
    <div>
      ${storeInfo.address ? `<p style="font-size:13px;color:#475569;margin-bottom:3px;">📍 ${storeInfo.address}</p>` : ''}
      ${storeInfo.phone ? `<p style="font-size:13px;color:#475569;margin-bottom:3px;">📞 ${storeInfo.phone}</p>` : ''}
      ${storeInfo.email ? `<p style="font-size:13px;color:#475569;">✉ ${storeInfo.email}</p>` : ''}
    </div>
    <div style="text-align:right;flex-shrink:0;">
      <div style="display:inline-block;background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:10px 16px;margin-bottom:8px;">
        <p style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#b45309;margin-bottom:4px;">FACTURE</p>
        <p style="font-family:monospace;font-size:15px;font-weight:700;color:#92400e;">${sale.invoiceNumber}</p>
      </div>
      <p style="font-size:13px;color:#475569;">${dateStr}</p>
      <p style="font-size:12px;color:#94a3b8;">${timeStr}</p>
    </div>
  </div>

  ${customerSection}

  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
    <thead>
      <tr style="background:#f8fafc;">
        <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;">Article</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;">P.U.</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;">Qté</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;margin-bottom:28px;">
    <div style="min-width:260px;">
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;">
        <span style="color:#64748b;">Sous-total</span>
        <span style="font-weight:500;">${formatCFA(sale.subtotal)}</span>
      </div>
      ${discountRow}
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0 8px;border-top:2px solid #e2e8f0;margin-top:4px;">
        <span style="font-size:15px;font-weight:800;">Total TTC</span>
        <span style="font-size:24px;font-weight:800;color:#b45309;">${formatCFA(sale.total)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;color:#94a3b8;">
        <span>Mode de paiement</span>
        <span style="font-weight:600;color:#475569;">${PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</span>
      </div>
    </div>
  </div>

  <div style="border-top:1px solid #e2e8f0;padding-top:20px;text-align:center;">
    <p style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px;">Merci pour votre confiance !</p>
    <p style="font-size:12px;color:#94a3b8;">Servi par : <strong style="color:#475569;">${sale.userName}</strong></p>
    <p style="font-size:11px;color:#cbd5e1;margin-top:8px;">Document généré par Mbongo</p>
  </div>
</body>
</html>`

  const w = window.open('', '_blank', 'width=780,height=900')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print(); w.close() }, 600)
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function InvoicesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [search, setSearch] = useState('')
  const [filterPayment, setFilterPayment] = useState('all')
  const [period, setPeriod] = useState('all')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => { setSales(getSales()); setStoreInfo(getStoreInfo()) }, [])

  const now = new Date()
  const filtered = [...sales].reverse().filter((s) => {
    const d = new Date(s.createdAt)
    const ms = s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      s.userName?.toLowerCase().includes(search.toLowerCase())
    const mp = period === 'all' ||
      (period === 'today' && d.toDateString() === now.toDateString()) ||
      (period === 'week' && d >= new Date(now.getTime() - 7 * 86400000)) ||
      (period === 'month' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
    const mpm = filterPayment === 'all' || s.paymentMethod === filterPayment
    return ms && mp && mpm
  })

  const totalRevenue = sales.reduce((s, x) => s + x.total, 0)
  const avgInvoice = sales.length ? Math.round(totalRevenue / sales.length) : 0
  const filteredTotal = filtered.reduce((s, x) => s + x.total, 0)

  const paymentBreakdown = (['cash', 'mobile', 'card', 'credit'] as const).map((pm) => ({
    key: pm,
    label: PAYMENT_LABELS[pm],
    count: sales.filter((s) => s.paymentMethod === pm).length,
    total: sales.filter((s) => s.paymentMethod === pm).reduce((s, x) => s + x.total, 0),
  })).filter((p) => p.count > 0)

  const viewInvoice = (sale: Sale) => { setSelectedSale(sale); setShowDialog(true) }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Factures</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sales.length} factures · <span className="font-semibold text-foreground">{formatCFA(totalRevenue)}</span> au total
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Factures', value: String(sales.length), sub: 'Total émises' },
          { label: formatCFA(totalRevenue), value: null, sub: "Chiffre d'affaires" },
          { label: formatCFA(avgInvoice), value: null, sub: 'Moyenne / facture' },
        ].map(({ label, sub }) => (
          <div key={sub} className="p-3 rounded-xl border bg-card border-border text-left">
            <p className="text-xl font-extrabold tracking-tight truncate">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Payment method breakdown */}
      {paymentBreakdown.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {paymentBreakdown.map(({ key, label, count, total }) => {
            const Icon = PAYMENT_ICONS[key]
            const isActive = filterPayment === key
            return (
              <button
                key={key}
                onClick={() => setFilterPayment(f => f === key ? 'all' : key)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all',
                  isActive ? 'border-primary bg-primary/5' : 'bg-card border-border hover:border-primary/30',
                  PAYMENT_COLORS[key].split(' ')[1]
                )}
              >
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', PAYMENT_COLORS[key])}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{count} · {formatCFA(total)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, client..."
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setSearch('')}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap',
                period === p.value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results summary */}
      {(period !== 'all' || filterPayment !== 'all' || search) && filtered.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">{filtered.length} résultat(s)</p>
          <p className="text-xs font-semibold">{formatCFA(filteredTotal)}</p>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
          <FileText className="w-10 h-10 mb-2 opacity-20" />
          <p className="text-sm">Aucune facture trouvée</p>
          {(search || filterPayment !== 'all') && (
            <button className="mt-2 text-xs text-primary hover:underline" onClick={() => { setSearch(''); setFilterPayment('all') }}>
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="sm:hidden space-y-2">
            {filtered.map((sale) => (
              <div
                key={sale.id}
                className="bg-card border border-border rounded-xl px-4 py-3 cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => viewInvoice(sale)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/8 px-2 py-0.5 rounded-md">
                        {sale.invoiceNumber}
                      </span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold', PAYMENT_COLORS[sale.paymentMethod])}>
                        {PAYMENT_LABELS[sale.paymentMethod]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {new Date(sale.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}
                      {sale.customerName ?? <span className="italic">Client de passage</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sale.items.length} article(s)</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-extrabold text-sm">{formatCFA(sale.total)}</span>
                    {storeInfo && (
                      <button
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted hover:bg-primary/10 hover:text-primary transition-all"
                        onClick={(e) => { e.stopPropagation(); printInvoice(sale, storeInfo) }}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <Card className="hidden sm:block border shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-xs font-bold uppercase tracking-wider">N° Facture</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Date</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Client</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Articles</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Paiement</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-right">Montant</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((sale) => (
                    <TableRow
                      key={sale.id}
                      className="cursor-pointer hover:bg-muted/20 transition-colors group"
                      onClick={() => viewInvoice(sale)}
                    >
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-primary bg-primary/8 px-2 py-1 rounded-md">
                          {sale.invoiceNumber}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        <p className="text-foreground">{new Date(sale.createdAt).toLocaleDateString('fr-FR')}</p>
                        <p className="text-[11px] text-muted-foreground">{new Date(sale.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {sale.customerName ?? <span className="text-muted-foreground italic text-xs">Client de passage</span>}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{sale.items.length}</span>
                        <span className="text-xs text-muted-foreground ml-1">art.</span>
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-semibold', PAYMENT_COLORS[sale.paymentMethod])}>
                          {PAYMENT_LABELS[sale.paymentMethod]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatCFA(sale.total)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                            onClick={(e) => { e.stopPropagation(); viewInvoice(sale) }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {storeInfo && (
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 hover:bg-muted hover:text-foreground"
                              onClick={(e) => { e.stopPropagation(); printInvoice(sale, storeInfo) }}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {/* Invoice preview dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" />
                <span className="font-mono text-sm">{selectedSale?.invoiceNumber}</span>
              </div>
              {selectedSale && storeInfo && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => printInvoice(selectedSale, storeInfo)}>
                  <Printer className="w-3.5 h-3.5" />Imprimer
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedSale && storeInfo && (
            <div className="space-y-5 py-2">
              {/* Store + invoice info */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-lg font-bold">{storeInfo.name}</h2>
                  {storeInfo.address && <p className="text-sm text-muted-foreground mt-0.5">{storeInfo.address}</p>}
                  {storeInfo.phone && <p className="text-sm text-muted-foreground">{storeInfo.phone}</p>}
                  {storeInfo.email && <p className="text-sm text-muted-foreground">{storeInfo.email}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="inline-block px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 mb-2">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Facture</p>
                    <p className="font-mono font-bold text-sm">{selectedSale.invoiceNumber}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedSale.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedSale.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Customer */}
              {selectedSale.customerName && (
                <div className="p-3.5 bg-muted/40 rounded-xl border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Client</p>
                  <p className="font-semibold">{selectedSale.customerName}</p>
                </div>
              )}

              {/* Items */}
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs font-bold uppercase tracking-wider">Article</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wider">P.U.</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Qté</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.items.map((item, i) => (
                      <TableRow key={i} className="hover:bg-muted/20">
                        <TableCell className="font-medium text-sm">{item.productName}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{formatCFA(item.unitPrice)}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{item.quantity}</TableCell>
                        <TableCell className="text-right font-bold text-sm">{formatCFA(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 ml-auto max-w-xs">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium">{formatCFA(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-rose-600">Remise</span>
                    <span className="text-rose-600 font-medium">−{formatCFA(selectedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="font-bold">Total TTC</span>
                  <span className="text-2xl font-extrabold text-primary">{formatCFA(selectedSale.total)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                  <span>Mode de paiement</span>
                  <span className={cn('px-2 py-0.5 rounded-full font-semibold text-[11px]', PAYMENT_COLORS[selectedSale.paymentMethod])}>
                    {PAYMENT_LABELS[selectedSale.paymentMethod]}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground border-t pt-4 space-y-1">
                <p className="font-medium text-foreground">Merci pour votre confiance !</p>
                <p>Servi par : <span className="font-semibold text-foreground">{selectedSale.userName}</span></p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
