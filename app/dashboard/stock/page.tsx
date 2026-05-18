'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getProducts, getCategories, addProduct, updateProduct, deleteProduct, addCategory, formatCFA } from '@/lib/store'
import type { Product } from '@/lib/types'
import {
  Search, Plus, Pencil, Trash2, Boxes, AlertTriangle, PackageX,
  Tag, ChevronUp, ChevronDown, ArrowUpDown, LayoutGrid, List, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STOCK_STATUS = (p: Product) =>
  p.quantity === 0 ? { label: 'Rupture', cls: 'bg-rose-100 text-rose-700' }
  : p.quantity <= p.minStock ? { label: 'Faible', cls: 'bg-amber-100 text-amber-700' }
  : { label: 'OK', cls: 'bg-emerald-100 text-emerald-700' }

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterStock, setFilterStock] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'price'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [showForm, setShowForm] = useState(false)
  const [showCatForm, setShowCatForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [newCat, setNewCat] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', description: '', category: '', purchasePrice: '',
    sellingPrice: '', quantity: '', minStock: '5', unit: 'piece', barcode: '',
  })

  useEffect(() => { load() }, [])
  const load = () => { setProducts(getProducts()); setCategories(getCategories()) }

  const resetForm = () => {
    setForm({ name: '', description: '', category: '', purchasePrice: '', sellingPrice: '', quantity: '', minStock: '5', unit: 'piece', barcode: '' })
    setEditing(null)
  }

  const openForm = (p?: Product) => {
    if (p) {
      setEditing(p)
      setForm({ name: p.name, description: p.description, category: p.category, purchasePrice: p.purchasePrice.toString(), sellingPrice: p.sellingPrice.toString(), quantity: p.quantity.toString(), minStock: p.minStock.toString(), unit: p.unit, barcode: p.barcode ?? '' })
    } else resetForm()
    setShowForm(true)
  }

  const save = () => {
    const data = { name: form.name, description: form.description, category: form.category, purchasePrice: Number(form.purchasePrice), sellingPrice: Number(form.sellingPrice), quantity: Number(form.quantity), minStock: Number(form.minStock), unit: form.unit, barcode: form.barcode || undefined }
    editing ? updateProduct(editing.id, data) : addProduct(data)
    setShowForm(false); resetForm(); load()
  }

  const confirmDelete = (id: string) => setDeleteId(id)
  const doDelete = () => { if (deleteId) { deleteProduct(deleteId); setDeleteId(null); load() } }

  const toggleSort = (f: typeof sortBy) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('asc') }
  }

  const SortBtn = ({ field, label }: { field: typeof sortBy; label: string }) => (
    <button className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wider whitespace-nowrap" onClick={() => toggleSort(field)}>
      {label}
      {sortBy === field
        ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
        : <ArrowUpDown className="w-3 h-3 opacity-30" />}
    </button>
  )

  const filtered = products
    .filter(p => {
      const ms = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
      const mc = filterCat === 'all' || p.category === filterCat
      const mst = filterStock === 'all' || (filterStock === 'low' && p.quantity <= p.minStock && p.quantity > 0) || (filterStock === 'out' && p.quantity === 0)
      return ms && mc && mst
    })
    .sort((a, b) => {
      const v = sortBy === 'name' ? a.name.localeCompare(b.name) : sortBy === 'quantity' ? a.quantity - b.quantity : a.sellingPrice - b.sellingPrice
      return sortDir === 'asc' ? v : -v
    })

  const lowStock = products.filter(p => p.quantity <= p.minStock && p.quantity > 0).length
  const outOfStock = products.filter(p => p.quantity === 0).length
  const totalValue = products.reduce((s, p) => s + p.purchasePrice * p.quantity, 0)
  const margin = form.purchasePrice && form.sellingPrice ? Number(form.sellingPrice) - Number(form.purchasePrice) : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Stock</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {products.length} produits · <span className="font-semibold text-foreground">{formatCFA(totalValue)}</span> en stock
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCatForm(true)} className="gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Catégorie</span>
          </Button>
          <Button size="sm" onClick={() => openForm()} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => setFilterStock('all')} className={cn('p-3 rounded-xl border text-left transition-all', filterStock === 'all' ? 'border-primary bg-primary/5' : 'bg-card border-border hover:border-primary/40')}>
          <p className="text-2xl font-extrabold">{products.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Boxes className="w-3 h-3" />Produits</p>
        </button>
        <button onClick={() => setFilterStock(filterStock === 'low' ? 'all' : 'low')} className={cn('p-3 rounded-xl border text-left transition-all', filterStock === 'low' ? 'border-amber-400 bg-amber-50' : lowStock > 0 ? 'bg-amber-50/50 border-amber-200 hover:border-amber-400' : 'bg-card border-border')}>
          <p className={cn('text-2xl font-extrabold', lowStock > 0 ? 'text-amber-700' : '')}>{lowStock}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Stock faible</p>
        </button>
        <button onClick={() => setFilterStock(filterStock === 'out' ? 'all' : 'out')} className={cn('p-3 rounded-xl border text-left transition-all', filterStock === 'out' ? 'border-rose-400 bg-rose-50' : outOfStock > 0 ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400' : 'bg-card border-border')}>
          <p className={cn('text-2xl font-extrabold', outOfStock > 0 ? 'text-rose-700' : '')}>{outOfStock}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><PackageX className="w-3 h-3" />Rupture</p>
        </button>
      </div>

      {/* Filters + view toggle */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom ou code-barres..." className="pl-9 bg-card" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')}><X className="w-3.5 h-3.5" /></button>}
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="sm:w-40 bg-card"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1 p-1 bg-muted rounded-lg self-start">
          <button onClick={() => setView('table')} className={cn('p-1.5 rounded-md transition-all', view === 'table' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}><List className="w-4 h-4" /></button>
          <button onClick={() => setView('grid')} className={cn('p-1.5 rounded-md transition-all', view === 'grid' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}><LayoutGrid className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Active filters */}
      {(filterCat !== 'all' || filterStock !== 'all' || search) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">{filtered.length} résultat(s)</span>
          {filterCat !== 'all' && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilterCat('all')}>{filterCat} <X className="w-2.5 h-2.5" /></Badge>}
          {filterStock !== 'all' && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilterStock('all')}>{filterStock === 'low' ? 'Stock faible' : 'Rupture'} <X className="w-2.5 h-2.5" /></Badge>}
          {search && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSearch('')}>"{search}" <X className="w-2.5 h-2.5" /></Badge>}
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Boxes className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">Aucun produit trouvé</p>
            </div>
          ) : filtered.map(p => {
            const st = STOCK_STATUS(p)
            return (
              <Card key={p.id} className="border shadow-none hover:shadow-sm transition-all cursor-pointer group" onClick={() => openForm(p)}>
                <CardContent className="p-3.5">
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <p className="font-semibold text-sm leading-tight line-clamp-2">{p.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold flex-shrink-0 ${st.cls}`}>{st.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] mb-2">{p.category}</Badge>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                    <p className="font-bold text-sm text-primary">{formatCFA(p.sellingPrice)}</p>
                    <p className="text-xs text-muted-foreground">{p.quantity} {p.unit}</p>
                  </div>
                  {/* Stock bar */}
                  <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', p.quantity === 0 ? 'bg-rose-400 w-full' : p.quantity <= p.minStock ? 'bg-amber-400' : 'bg-emerald-400')}
                      style={{ width: p.quantity === 0 ? '100%' : `${Math.min((p.quantity / Math.max(p.minStock * 3, p.quantity)) * 100, 100)}%` }} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <Card className="border shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="pl-4"><SortBtn field="name" label="Produit" /></TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Catégorie</TableHead>
                  <TableHead><SortBtn field="price" label="Prix vente" /></TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold hidden sm:table-cell">Achat</TableHead>
                  <TableHead><SortBtn field="quantity" label="Qté" /></TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold hidden md:table-cell">Valeur</TableHead>
                  <TableHead className="text-right pr-4 text-xs uppercase tracking-wider font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                      <Boxes className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Aucun produit trouvé</p>
                      <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => openForm()}>
                        <Plus className="w-3.5 h-3.5" />Ajouter un produit
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : filtered.map(p => {
                  const st = STOCK_STATUS(p)
                  return (
                    <TableRow key={p.id} className="hover:bg-muted/20">
                      <TableCell className="pl-4">
                        <p className="font-semibold text-sm">{p.name}</p>
                        {p.barcode && <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{p.barcode}</p>}
                        {p.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>}
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-[11px]">{p.category}</Badge></TableCell>
                      <TableCell className="font-bold text-primary text-sm">{formatCFA(p.sellingPrice)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">{formatCFA(p.purchasePrice)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold w-fit ${st.cls}`}>{p.quantity} {p.unit}</span>
                          {p.minStock > 0 && (
                            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                              <div className={cn('h-full rounded-full transition-all', p.quantity === 0 ? 'bg-rose-400 w-full' : p.quantity <= p.minStock ? 'bg-amber-400' : 'bg-emerald-400')}
                                style={{ width: `${Math.min((p.quantity / (p.minStock * 3)) * 100, 100)}%` }} />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium hidden md:table-cell">{formatCFA(p.purchasePrice * p.quantity)}</TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10 hover:text-primary" onClick={() => openForm(p)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-rose-50 hover:text-rose-600" onClick={() => confirmDelete(p.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Product dialog */}
      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) resetForm() }}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Boxes className="w-4 h-4 text-primary" />
              {editing ? 'Modifier le produit' : 'Nouveau produit'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Nom du produit *</Label>
              <Input className="h-10" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Coca-Cola 33cl" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Catégorie *</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Unité</Label>
                <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{['piece', 'kg', 'litre', 'carton', 'paquet'].map(u => <SelectItem key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Prices section */}
            <div className="p-3 rounded-xl bg-muted/30 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tarification</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Prix d'achat (FCFA) *</Label>
                  <Input type="number" inputMode="numeric" className="h-10 font-semibold" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Prix de vente (FCFA) *</Label>
                  <Input type="number" inputMode="numeric" className="h-10 font-semibold" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} placeholder="0" />
                </div>
              </div>
              {margin !== null && form.purchasePrice && Number(form.purchasePrice) > 0 && (
                <div className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${margin >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  <span>Marge</span>
                  <span className="font-bold">{formatCFA(margin)} · {((margin / Number(form.purchasePrice)) * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>

            {/* Stock section */}
            <div className="p-3 rounded-xl bg-muted/30 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inventaire</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Quantité en stock *</Label>
                  <Input type="number" inputMode="numeric" className="h-10 font-semibold" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Alerte stock min.</Label>
                  <Input type="number" inputMode="numeric" className="h-10" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} placeholder="5" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Code-barres</Label>
              <Input className="h-10 font-mono" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="Ex: 3700123456789" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Annuler</Button>
            <Button onClick={save} disabled={!form.name || !form.category || !form.purchasePrice || !form.sellingPrice || !form.quantity}>
              {editing ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category dialog */}
      <Dialog open={showCatForm} onOpenChange={setShowCatForm}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="text-base flex items-center gap-2"><Tag className="w-4 h-4 text-primary" />Nouvelle catégorie</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <Input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Ex: Vivres" className="h-10" autoFocus onKeyDown={e => e.key === 'Enter' && newCat.trim() && (addCategory({ name: newCat.trim(), description: '' }), setNewCat(''), setShowCatForm(false), load())} />
            {categories.length > 0 && <div className="flex flex-wrap gap-1.5">{categories.map(c => <Badge key={c.id} variant="secondary" className="text-xs">{c.name}</Badge>)}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCatForm(false)}>Annuler</Button>
            <Button size="sm" disabled={!newCat.trim()} onClick={() => { addCategory({ name: newCat.trim(), description: '' }); setNewCat(''); setShowCatForm(false); load() }}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="text-base text-destructive flex items-center gap-2"><Trash2 className="w-4 h-4" />Supprimer le produit</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Cette action est irréversible. Le produit sera définitivement supprimé.</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button size="sm" variant="destructive" onClick={doDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
