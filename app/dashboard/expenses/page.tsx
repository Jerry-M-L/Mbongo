'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { getExpenses, getExpenseCategories, addExpense, deleteExpense, addExpenseCategory, formatCFA } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'
import type { Expense } from '@/lib/types'
import { Plus, Trash2, TrendingDown, Calendar, Search, Receipt, Tag, X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const PERIODS = [
  { value: 'all', label: 'Tout' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: '7 jours' },
  { value: 'month', label: 'Ce mois' },
]

function formatDay(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [period, setPeriod] = useState('month')
  const [showCatDialog, setShowCatDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [newCat, setNewCat] = useState('')

  // Quick-add form
  const [quickForm, setQuickForm] = useState({
    description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0],
  })
  const descRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])
  const load = () => { setExpenses(getExpenses()); setCategories(getExpenseCategories()) }

  const addQuick = () => {
    if (!user || !quickForm.description || !quickForm.amount || !quickForm.category) return
    addExpense({ description: quickForm.description, amount: Number(quickForm.amount), category: quickForm.category, date: quickForm.date, userId: user.id, userName: user.name })
    setQuickForm({ description: '', amount: '', category: quickForm.category, date: new Date().toISOString().split('T')[0] })
    load()
    descRef.current?.focus()
  }

  const filtered = expenses.filter(e => {
    const now = new Date()
    const d = new Date(e.createdAt)
    const ms = e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase())
    const mc = filterCat === 'all' || e.category === filterCat
    const mp = period === 'all' ||
      (period === 'today' && d.toDateString() === now.toDateString()) ||
      (period === 'week' && d >= new Date(now.getTime() - 7 * 86400000)) ||
      (period === 'month' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
    return ms && mc && mp
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Group by date
  const grouped = filtered.reduce((acc, e) => {
    const day = new Date(e.createdAt).toDateString()
    if (!acc[day]) acc[day] = []
    acc[day].push(e)
    return acc
  }, {} as Record<string, Expense[]>)

  const today = new Date().toDateString()
  const now = new Date()
  const todayTotal = expenses.filter(e => new Date(e.createdAt).toDateString() === today).reduce((s, e) => s + e.amount, 0)
  const monthTotal = expenses.filter(e => { const d = new Date(e.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).reduce((s, e) => s + e.amount, 0)
  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0)

  const byCategory = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] ?? 0) + e.amount; return acc }, {} as Record<string, number>)
  const maxCatAmt = Math.max(...Object.values(byCategory), 1)
  const canAdd = !!quickForm.description && !!quickForm.amount && !!quickForm.category

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dépenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{expenses.length} entrées · <span className="font-semibold text-foreground">{formatCFA(monthTotal)}</span> ce mois</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCatDialog(true)} className="gap-1.5">
          <Tag className="w-3.5 h-3.5" /><span className="hidden sm:inline">Catégorie</span>
        </Button>
      </div>

      {/* Stats strip — collapsible */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Aujourd'hui", value: todayTotal, active: period === 'today', onClick: () => setPeriod(p => p === 'today' ? 'all' : 'today') },
          { label: 'Ce mois', value: monthTotal, active: period === 'month', onClick: () => setPeriod(p => p === 'month' ? 'all' : 'month') },
          { label: 'Sélection', value: filteredTotal, active: false, onClick: () => {} },
        ].map(({ label, value, active, onClick }) => (
          <button key={label} onClick={onClick} className={cn('p-3 rounded-xl border text-left transition-all', active ? 'border-rose-400 bg-rose-50' : 'bg-card border-border hover:border-rose-200')}>
            <p className={cn('text-xl font-extrabold tracking-tight', active ? 'text-rose-700' : '')}>{formatCFA(value)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Category breakdown toggle */}
      {Object.keys(byCategory).length > 0 && (
        <Card className="border shadow-none overflow-hidden">
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors" onClick={() => setShowStats(!showStats)}>
            <span className="text-sm font-semibold flex items-center gap-2"><TrendingDown className="w-4 h-4 text-rose-500" />Répartition par catégorie</span>
            {showStats ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showStats && (
            <CardContent className="px-4 pb-4 pt-0 space-y-2.5">
              {Object.entries(byCategory).sort(([, a], [, b]) => b - a).map(([cat, amt]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <button className="font-medium hover:text-primary transition-colors" onClick={() => setFilterCat(f => f === cat ? 'all' : cat)}>{cat}</button>
                    <span className="font-bold text-rose-600">{formatCFA(amt)}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-rose-400/70 rounded-full transition-all" style={{ width: `${(amt / maxCatAmt) * 100}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Quick-add form */}
      <Card className="border shadow-none">
        <CardContent className="px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Saisie rapide</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input ref={descRef} placeholder="Description de la dépense..." className="flex-1 h-9" value={quickForm.description}
              onChange={e => setQuickForm({ ...quickForm, description: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && canAdd && addQuick()} />
            <Input type="number" inputMode="numeric" placeholder="Montant FCFA" className="sm:w-36 h-9 font-semibold" value={quickForm.amount}
              onChange={e => setQuickForm({ ...quickForm, amount: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && canAdd && addQuick()} />
            <Select value={quickForm.category} onValueChange={v => setQuickForm({ ...quickForm, category: v })}>
              <SelectTrigger className="sm:w-40 h-9"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" className="sm:w-36 h-9" value={quickForm.date} onChange={e => setQuickForm({ ...quickForm, date: e.target.value })} />
            <Button size="sm" className="h-9 gap-1.5 px-4" disabled={!canAdd} onClick={addQuick}>
              <Plus className="w-3.5 h-3.5" />Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-9 bg-card" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setSearch('')}><X className="w-3.5 h-3.5" /></button>}
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="sm:w-40 bg-card"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={cn('px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap', period === p.value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline grouped by date */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
          <Receipt className="w-10 h-10 mb-2 opacity-20" />
          <p className="text-sm">Aucune dépense pour cette période</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([day, items]) => {
            const dayTotal = items.reduce((s, e) => s + e.amount, 0)
            return (
              <div key={day}>
                {/* Day header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider capitalize">{formatDay(items[0].createdAt)}</span>
                  <span className="text-xs font-semibold text-rose-600">{formatCFA(dayTotal)}</span>
                </div>
                <div className="space-y-1.5">
                  {items.map(e => (
                    <div key={e.id} className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-border/80 transition-all group">
                      <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{e.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded-sm">{e.category}</Badge>
                          <span className="text-[11px] text-muted-foreground">{e.userName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold text-sm text-rose-600">−{formatCFA(e.amount)}</span>
                        <button onClick={() => setDeleteId(e.id)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="text-base text-destructive flex items-center gap-2"><Trash2 className="w-4 h-4" />Supprimer la dépense</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Cette dépense sera définitivement supprimée.</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button size="sm" variant="destructive" onClick={() => { if (deleteId) { deleteExpense(deleteId); setDeleteId(null); load() } }}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category dialog */}
      <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="text-base flex items-center gap-2"><Tag className="w-4 h-4 text-primary" />Nouvelle catégorie</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <Input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Ex: Maintenance" className="h-10" autoFocus onKeyDown={e => e.key === 'Enter' && newCat.trim() && (addExpenseCategory({ name: newCat.trim() }), setNewCat(''), setShowCatDialog(false), load())} />
            {categories.length > 0 && <div className="flex flex-wrap gap-1.5">{categories.map(c => <Badge key={c.id} variant="secondary" className="text-xs">{c.name}</Badge>)}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCatDialog(false)}>Annuler</Button>
            <Button size="sm" disabled={!newCat.trim()} onClick={() => { addExpenseCategory({ name: newCat.trim() }); setNewCat(''); setShowCatDialog(false); load() }}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
