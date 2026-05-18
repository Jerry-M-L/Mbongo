'use client'

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth-context'
import type { User } from '@/lib/types'
import {
  Search, Pencil, Trash2, ShieldAlert, ShieldCheck, UserCog,
  Lock, Mail, UserPlus, Eye, EyeOff, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BetterUser {
  id: string; name: string | null; email: string; role: string
  emailVerified: boolean; createdAt: string; updatedAt: string
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof ShieldCheck; desc: string }> = {
  admin: { label: 'Administrateur', color: 'bg-rose-100 text-rose-700', icon: ShieldAlert, desc: 'Accès complet' },
  gestionnaire: { label: 'Gestionnaire', color: 'bg-amber-100 text-amber-700', icon: UserCog, desc: 'Stock & rapports' },
  caissier: { label: 'Caissier', color: 'bg-sky-100 text-sky-700', icon: ShieldCheck, desc: 'Ventes uniquement' },
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'caissier' as User['role'] })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data } = await authClient.admin.listUsers({ query: { limit: 100 } })
      if (data?.users) setUsers(data.users.map((u: BetterUser) => ({
        id: u.id, name: u.name ?? '', email: u.email, role: u.role as User['role'],
        emailVerified: u.emailVerified, createdAt: u.createdAt, updatedAt: u.updatedAt,
      })))
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const resetForm = () => { setForm({ name: '', email: '', password: '', role: 'caissier' }); setEditing(null); setShowPwd(false) }

  const openDialog = (u?: User) => {
    if (u) { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }) }
    else resetForm()
    setShowDialog(true)
  }

  const save = async () => {
    if (!form.name || !form.email || (!editing && !form.password)) return
    setSaving(true)
    try {
      if (editing) {
        await authClient.admin.updateUser({ userId: editing.id, data: { name: form.name, email: form.email, role: form.role } })
        if (form.password) await authClient.admin.setUserPassword({ userId: editing.id, password: form.password })
      } else {
        await authClient.admin.createUser({ name: form.name, email: form.email, password: form.password, role: form.role })
      }
      setShowDialog(false); resetForm(); await loadData()
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try { await authClient.admin.removeUser({ userId: deleteTarget.id }); await loadData() }
    catch (e) { console.error(e) }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-rose-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Accès refusé</h2>
          <p className="text-muted-foreground text-sm mt-1">Réservé aux administrateurs.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} compte(s) enregistré(s)</p>
        </div>
        <Button size="sm" onClick={() => openDialog()} className="gap-1.5">
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Nouvel</span> utilisateur
        </Button>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['admin', 'gestionnaire', 'caissier'] as const).map((role) => {
          const cfg = ROLE_CONFIG[role]
          const Icon = cfg.icon
          const count = users.filter((u) => u.role === role).length
          return (
            <div key={role} className={cn('p-3 rounded-xl border text-left', cfg.color.replace('text-', 'border-').replace('-700', '-200'), 'bg-card')}>
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mb-2', cfg.color)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-2xl font-extrabold">{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
            </div>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou email..."
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

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Chargement...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
          <UserCog className="w-10 h-10 mb-2 opacity-20" />
          <p className="text-sm">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => {
            const cfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.caissier
            const RoleIcon = cfg.icon
            const isMe = u.id === currentUser?.id
            return (
              <div key={u.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{u.name.charAt(0).toUpperCase()}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{u.name}</p>
                    {isMe && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">Vous</span>
                    )}
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1', cfg.color)}>
                      <RoleIcon className="w-2.5 h-2.5" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Créé le {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                    onClick={() => openDialog(u)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                    onClick={() => !isMe && setDeleteTarget(u)}
                    disabled={isMe}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={showDialog} onOpenChange={(v) => { setShowDialog(v); if (!v) resetForm() }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UserCog className="w-4 h-4 text-primary" />
              {editing ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nom complet *</label>
              <Input className="h-10" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Jean-Pierre Dondra" autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input type="email" className="pl-9 h-10" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jean@boutique.cf" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {editing ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type={showPwd ? 'text' : 'password'} className="pl-9 pr-10 h-10"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" />
                <button type="button" tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rôle *</label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as User['role'] })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_CONFIG).map(([val, cfg]) => (
                    <SelectItem key={val} value={val}>
                      <div className="flex items-center gap-2">
                        <cfg.icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{cfg.label}</span>
                        <span className="text-xs text-muted-foreground">— {cfg.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowDialog(false); resetForm() }}>Annuler</Button>
            <Button size="sm" onClick={save}
              disabled={!form.name || !form.email || (!editing && !form.password) || saving}>
              {saving
                ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Enregistrement…</span>
                : editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base text-destructive flex items-center gap-2">
              <Trash2 className="w-4 h-4" />Supprimer l'utilisateur
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Voulez-vous supprimer <span className="font-semibold text-foreground">{deleteTarget?.name}</span> ?
              Cette action est irréversible.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button size="sm" variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting
                ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Suppression…</span>
                : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
