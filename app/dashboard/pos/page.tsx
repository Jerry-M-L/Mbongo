'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { getProducts, getCategories, getCustomers, getOpenCashRegister, addSale, formatCFA } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'
import type { Product, Category, Customer, SaleItem } from '@/lib/types'
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Smartphone,
  Banknote, Receipt, AlertCircle, CheckCircle2, ScanBarcode, X, ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { cn } from '@/lib/utils'

/* ── helpers ──────────────────────────────────────────────────── */
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces', icon: Banknote },
  { value: 'mobile', label: 'Mobile Money', icon: Smartphone },
  { value: 'card', label: 'Carte', icon: CreditCard },
  { value: 'credit', label: 'Crédit', icon: Receipt },
] as const

/* ── Page ─────────────────────────────────────────────────────── */
export default function POSPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<SaleItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile' | 'card' | 'credit'>('cash')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [cashReceived, setCashReceived] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastSale, setLastSale] = useState<{ invoiceNumber: string; total: number } | null>(null)
  const [cashRegisterOpen, setCashRegisterOpen] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showCartSheet, setShowCartSheet] = useState(false) // mobile only
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setProducts(getProducts())
    setCategories(getCategories())
    setCustomers(getCustomers())
    setCashRegisterOpen(!!getOpenCashRegister())
  }, [])

  /* ── Cart logic ─────────────────────────────────────────────── */
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.productId === product.id)
      if (ex) {
        if (ex.quantity >= product.quantity) return prev
        return prev.map((i) => i.productId === product.id
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
          : i)
      }
      return [...prev, { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.sellingPrice, total: product.sellingPrice }]
    })
  }

  const updateQty = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setCart((prev) => prev.map((i) => {
      if (i.productId !== productId) return i
      const q = Math.max(1, Math.min(i.quantity + delta, product.quantity))
      return { ...i, quantity: q, total: q * i.unitPrice }
    }))
  }

  const removeFromCart = (id: string) => setCart((p) => p.filter((i) => i.productId !== id))
  const clearCart = () => { setCart([]); setDiscount(0); setSelectedCustomer('') }

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.total, 0), [cart])
  const discountAmt = useMemo(() => (subtotal * discount) / 100, [subtotal, discount])
  const total = subtotal - discountAmt
  const change = Number(cashReceived) - total
  const canCheckout = (paymentMethod !== 'cash' || Number(cashReceived) >= total) && !(paymentMethod === 'credit' && !selectedCustomer)

  const handleBarcodeDetected = (barcode: string) => {
    const p = products.find((x) => x.barcode === barcode)
    if (p) addToCart(p)
    else setSearch(barcode)
  }

  const handleCheckout = () => {
    if (!user || cart.length === 0) return
    const customer = customers.find((c) => c.id === selectedCustomer)
    const sale = addSale({
      items: cart, subtotal, discount: discountAmt, total, paymentMethod,
      customerId: selectedCustomer || undefined, customerName: customer?.name,
      userId: user.id, userName: user.name,
    })
    setLastSale({ invoiceNumber: sale.invoiceNumber, total: sale.total })
    setShowCheckout(false); setShowCartSheet(false)
    setShowSuccess(true); clearCart(); setCashReceived('')
    setProducts(getProducts())
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter((p) => {
      const ms = !q || p.name.toLowerCase().includes(q) || p.barcode?.includes(search)
      const mc = category === 'all' || p.category === category
      return ms && mc && p.quantity > 0
    })
  }, [products, search, category])

  /* ── Caisse fermée ──────────────────────────────────────────── */
  if (!cashRegisterOpen) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Caisse fermée</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-xs">
            Ouvrez la caisse depuis le tableau de bord pour commencer les ventes.
          </p>
        </div>
        <Button asChild><Link href="/dashboard">Tableau de bord</Link></Button>
      </div>
    )
  }

  /* ── Cart panel (réutilisé desktop + mobile sheet) ──────────── */
  const CartPanel = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Panier</span>
          {cart.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-destructive font-medium">
              Vider
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 py-10">
            <ShoppingCart className="w-8 h-8 opacity-20" />
            <p className="text-sm">Panier vide</p>
            <p className="text-xs opacity-60">Appuyez sur un produit pour l'ajouter</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatCFA(item.unitPrice)} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden">
                    <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-muted active:bg-muted transition-colors" onClick={() => updateQty(item.productId, -1)}>
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-muted active:bg-muted transition-colors" onClick={() => updateQty(item.productId, 1)}>
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => removeFromCart(item.productId)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm font-bold w-20 text-right flex-shrink-0">{formatCFA(item.total)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="border-t border-border p-4 space-y-3 bg-muted/10">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="font-medium">{formatCFA(subtotal)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Remise %</span>
            <Input type="number" className="h-8 w-20 text-center font-semibold" value={discount}
              onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))} />
            {discount > 0 && <span className="text-xs text-rose-600 font-medium">−{formatCFA(discountAmt)}</span>}
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="font-bold">Total</span>
            <span className="text-2xl font-extrabold text-primary tracking-tight">{formatCFA(total)}</span>
          </div>
          <Button className="w-full h-12 font-bold text-base gap-2" onClick={() => setShowCheckout(true)}>
            <ShoppingCart className="w-4 h-4" />
            Encaisser · {formatCFA(total)}
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* ── Layout wrapper ───────────────────────────────────── */}
      <div className="flex flex-col gap-3 h-full lg:grid lg:grid-cols-[1fr_340px] lg:gap-4">

        {/* ── Product section ──────────────────────────────── */}
        <div className="flex flex-col gap-3 min-h-0">

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Rechercher ou scanner..."
                className="pl-9 pr-10 h-10 bg-card"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search ? (
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg leading-none" onClick={() => setSearch('')}>×</button>
              ) : (
                <button className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  onClick={() => setShowScanner(true)}>
                  <ScanBarcode className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Desktop: category select */}
            <div className="hidden lg:block">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-44 h-10 bg-card"><SelectValue placeholder="Catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0 border-primary/30 text-primary hover:bg-primary/10 hidden lg:flex"
              onClick={() => setShowScanner(true)}>
              <ScanBarcode className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile: horizontal scrollable category chips */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setCategory('all')}
              className={cn('flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all',
                category === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground')}
            >
              Tout
            </button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.name)}
                className={cn('flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all',
                  category === c.name ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground')}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Desktop: category chips as badges if active */}
          {category !== 'all' && (
            <div className="hidden lg:flex items-center gap-2">
              <Badge variant="secondary">{category}</Badge>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setCategory('all')}>Effacer</button>
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                <ScanBarcode className="w-10 h-10 opacity-20" />
                <p className="text-sm">Aucun produit trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 content-start pb-24 lg:pb-4">
                {filtered.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => { addToCart(product); if (window.innerWidth < 1024) setShowCartSheet(false) }}
                    className="group p-3 sm:p-3.5 bg-card border border-border rounded-xl text-left hover:border-primary active:scale-95 transition-all duration-150 select-none"
                  >
                    {/* Category label */}
                    <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-md font-bold mb-2 bg-primary/10 text-primary">
                      {product.category}
                    </span>
                    <p className="font-semibold text-sm leading-tight line-clamp-2 mb-2 min-h-[2.5rem]">{product.name}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-primary">{formatCFA(product.sellingPrice)}</p>
                      <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-semibold',
                        product.quantity <= product.minStock
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      )}>
                        {product.quantity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Desktop cart ─────────────────────────────────── */}
        <div className="hidden lg:flex flex-col bg-card border border-border rounded-xl overflow-hidden">
          <CartPanel />
        </div>
      </div>

      {/* ── Mobile: FAB cart button ───────────────────────── */}
      <div className="lg:hidden">
        {cart.length > 0 ? (
          <button
            onClick={() => setShowCartSheet(true)}
            className="fixed bottom-20 right-4 z-30 flex items-center gap-2.5 pl-3 pr-4 h-14 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-all"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-4.5 h-4.5 bg-white text-primary text-[10px] font-black rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            </div>
            <div className="text-left">
              <p className="text-[11px] font-semibold opacity-80 leading-none">Panier</p>
              <p className="text-base font-extrabold leading-tight tracking-tight">{formatCFA(total)}</p>
            </div>
          </button>
        ) : (
          <button
            onClick={() => setShowScanner(true)}
            className="fixed bottom-20 right-4 z-30 w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-all"
          >
            <ScanBarcode className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* ── Mobile: cart bottom sheet ─────────────────────── */}
      {showCartSheet && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCartSheet(false)} />
          <div className="relative bg-card rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Pull handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <CartPanel onClose={() => setShowCartSheet(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Scanner ──────────────────────────────────────── */}
      <BarcodeScanner open={showScanner} onClose={() => setShowScanner(false)} onDetected={handleBarcodeDetected} />

      {/* ── Checkout dialog ──────────────────────────────── */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Encaissement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total à encaisser</p>
              <p className="text-4xl font-extrabold text-primary tracking-tight">{formatCFA(total)}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Mode de paiement</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={cn('flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-sm font-semibold transition-all active:scale-[0.97]',
                      paymentMethod === m.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-background text-muted-foreground'
                    )}
                  >
                    <m.icon className="w-4 h-4 flex-shrink-0" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Montant reçu (FCFA)</Label>
                <Input type="number" inputMode="numeric" placeholder="0" value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="h-14 text-2xl font-bold text-center" autoFocus />
                {Number(cashReceived) >= total && Number(cashReceived) > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-emerald-700">
                      Monnaie à rendre : {formatCFA(change)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'credit' && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Client</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowCheckout(false)}>Annuler</Button>
            <Button className="w-full sm:w-auto gap-2 h-12 text-base font-bold" onClick={handleCheckout} disabled={!canCheckout}>
              <CheckCircle2 className="w-5 h-5" />
              Valider la vente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Success ──────────────────────────────────────── */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-sm text-center">
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Vente enregistrée !</h2>
              {lastSale && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-muted-foreground font-mono">{lastSale.invoiceNumber}</p>
                  <p className="text-3xl font-extrabold text-primary">{formatCFA(lastSale.total)}</p>
                </div>
              )}
            </div>
          </div>
          <Button className="w-full h-12 gap-2 font-bold" onClick={() => setShowSuccess(false)}>
            <Plus className="w-4 h-4" />
            Nouvelle vente
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
