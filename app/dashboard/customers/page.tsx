'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, getSales, formatCFA } from '@/lib/store'
import type { Customer, Sale } from '@/lib/types'
import {
  Search, Plus, Pencil, Trash2, UsersRound, UserPlus, CreditCard,
  Phone, Mail, MapPin, ShoppingBag, X, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'credit'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })

  useEffect(() => { load() }, [])
  const load = () => { setCustomers(getCustomers()); setSales(getSales()) }

  const openForm = (c?: Customer) => {
    if (c) { setEditing(c); setForm({ name: c.name, phone: c.phone, email: c.email ?? '', address: c.address ?? '' }) }
    else { setEditing(null); setForm({ name: '', phone: '', email: '', address: '' }) }
    setShowForm(true)
  }

  const save = () => {
    if (!form.name || !form.phone) return
    editing ? updateCustomer(editing.id, form) : addCustomer(form)
    setShowForm(false); setEditing(null); load()
  }

  const getStats = (id: string) => {
    const cs = sales.filter(s => s.customerId === id)
    return { count: cs.length, total: cs.reduce((s, x) => s + x.total, 0), lastSale: cs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] }
  }

  const filtered = customers.filter(c => {
    const ms = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'all' || (filter === 'credit' && c.balance > 0)
    return ms && mf
  })

  const totalCredit = customers.reduce((s, c) => s + c.balance, 0)
  const withCredit = customers.filter(c => c.balance > 0)
  const selected = customers.find(c => c.id === selectedId)
  const selectedStats = selectedId ? getStats(selectedId) : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{customers.length} clients enregistrés</p>
        </div>
        <Button size="sm" onClick={() => openForm()} className="gap-1.5">
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Nouveau</span> client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => setFilter('all')} className={cn('p-3 rounded-xl border text-left transition-all', filter === 'all' ? 'border-primary bg-primary/5' : 'bg-card border-border hover:border-primary/40')}>
          <p className="text-2xl font-extrabold">{customers.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><UsersRound className="w-3 h-3" />Total</p>
        </button>
        <button onClick={() => setFilter(f => f === 'credit' ? 'all' : 'credit')} className={cn('p-3 rounded-xl border text-left transition-all', filter === 'credit' ? 'border-amber-400 bg-amber-50' : withCredit.length > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-card border-border')}>
          <p className={cn('text-2xl font-extrabold', withCredit.length > 0 ? 'text-amber-700' : '')}>{withCredit.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><CreditCard className="w-3 h-3" />Avec crédit</p>
        </button>
        <div className={cn('p-3 rounded-xl border text-left', totalCredit > 0 ? 'bg-rose-50/40 border-rose-200' : 'bg-card border-border')}>
          <p className={cn('text-lg font-extrabold truncate', totalCredit > 0 ? 'text-rose-700' : '')}>{formatCFA(totalCredit)}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Encours</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom, téléphone ou email..." className="pl-9 bg-card" value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setSearch('')}><X className="w-3.5 h-3.5" /></button>}
      </div>

      {/* Customer list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
          <UsersRound className="w-10 h-10 mb-2 opacity-20" />
          <p className="text-sm">Aucun client trouvé</p>
          {search && <button className="mt-2 text-xs text-primary hover:underline" onClick={() => setSearch('')}>Effacer la recherche</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const stats = getStats(c.id)
            const isSelected = selectedId === c.id
            return (
              <div key={c.id} className={cn('bg-card border rounded-xl transition-all overflow-hidden', isSelected ? 'border-primary shadow-sm' : 'border-border hover:border-border/80')}>
                {/* Main row */}
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setSelectedId(isSelected ? null : c.id)}>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">{c.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{c.name}</p>
                      {c.balance > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">
                          Doit {formatCFA(c.balance)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                      {stats.count > 0 && <span className="text-xs text-muted-foreground flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{stats.count} achat(s)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {stats.total > 0 && <span className="text-sm font-bold hidden sm:block">{formatCFA(stats.total)}</span>}
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10 hover:text-primary" onClick={e => { e.stopPropagation(); openForm(c) }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-rose-50 hover:text-rose-600" onClick={e => { e.stopPropagation(); setDeleteId(c.id) }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <div className="border-t border-border px-4 py-3 bg-muted/20">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                      {[
                        { label: 'Achats', value: String(stats.count) },
                        { label: 'Total dépensé', value: formatCFA(stats.total) },
                        { label: 'Solde crédit', value: formatCFA(c.balance), red: c.balance > 0 },
                        { label: 'Dernier achat', value: stats.lastSale ? new Date(stats.lastSale.createdAt).toLocaleDateString('fr-FR') : '—' },
                      ].map(({ label, value, red }) => (
                        <div key={label}>
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className={cn('text-sm font-bold mt-0.5', red ? 'text-rose-600' : '')}>{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 flex-wrap text-xs text-muted-foreground">
                      {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                      {c.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.address}</span>}
                    </div>
                    {/* Recent purchases */}
                    {stats.count > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Derniers achats</p>
                        <div className="space-y-1">
                          {sales.filter(s => s.customerId === c.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3).map(s => (
                            <div key={s.id} className="flex items-center justify-between text-xs">
                              <span className="font-mono text-muted-foreground">{s.invoiceNumber}</span>
                              <span className="font-semibold">{formatCFA(s.total)}</span>
                              <span className="text-muted-foreground">{new Date(s.createdAt).toLocaleDateString('fr-FR')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditing(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <UsersRound className="w-4 h-4 text-primary" />
              {editing ? 'Modifier le client' : 'Nouveau client'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {[
              { key: 'name', label: 'Nom complet *', icon: UsersRound, placeholder: 'Ex: Patrice Émile', type: 'text' },
              { key: 'phone', label: 'Téléphone *', icon: Phone, placeholder: '+236 75 00 00 00', type: 'tel' },
              { key: 'email', label: 'Email', icon: Mail, placeholder: 'exemple@email.com', type: 'email' },
              { key: 'address', label: 'Adresse', icon: MapPin, placeholder: 'Quartier, Ville', type: 'text' },
            ].map(({ key, label, icon: Icon, placeholder, type }, i) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-sm">{label}</Label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input type={type} className="pl-9 h-10" value={form[key as keyof typeof form]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder} autoFocus={i === 0} />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button size="sm" onClick={save} disabled={!form.name || !form.phone}>{editing ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="text-base text-destructive flex items-center gap-2"><Trash2 className="w-4 h-4" />Supprimer le client</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">L'historique des achats sera conservé. Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button size="sm" variant="destructive" onClick={() => { if (deleteId) { deleteCustomer(deleteId); setDeleteId(null); load() } }}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
