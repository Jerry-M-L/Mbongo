'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getStoreInfo, updateStoreInfo } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'
import type { StoreInfo } from '@/lib/types'
import {
  Store, Save, ShieldAlert, CheckCircle2, MapPin, Phone, Mail,
  ShieldCheck, Database, Globe, Clock, Coins,
} from 'lucide-react'

export default function SettingsPage() {
  const { user: currentUser } = useAuth()
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({ name: '', address: '', phone: '', email: '' })
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => { setStoreInfo(getStoreInfo()) }, [])

  const update = (field: keyof StoreInfo, value: string) => {
    setStoreInfo((p) => ({ ...p, [field]: value }))
    setDirty(true)
  }

  const save = () => {
    updateStoreInfo(storeInfo)
    setSaved(true); setDirty(false)
    setTimeout(() => setSaved(false), 3000)
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-destructive" />
        </div>
        <div>
          <h2 className="font-bold">Accès refusé</h2>
          <p className="text-sm text-muted-foreground mt-1">Réservé aux administrateurs.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configuration de votre boutique</p>
      </div>

      {/* Store info */}
      <Card className="border shadow-none">
        <CardHeader className="px-5 py-4 border-b">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            Informations de la boutique
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nom de la boutique</label>
            <Input
              className="h-10" value={storeInfo.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Ex: Boutique Ndeko"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Adresse</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className="pl-9 h-10" value={storeInfo.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Ex: Avenue Boganda, Bangui"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  className="pl-9 h-10" value={storeInfo.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+236 75 00 00 00"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="email" className="pl-9 h-10" value={storeInfo.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="contact@boutique.cf"
                />
              </div>
            </div>
          </div>

          {/* Preview badge */}
          {(storeInfo.name || storeInfo.phone) && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Aperçu en-tête de facture</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-black text-base">M</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-tight truncate">{storeInfo.name || 'Nom de la boutique'}</p>
                  {storeInfo.address && <p className="text-xs text-muted-foreground truncate mt-0.5">{storeInfo.address}</p>}
                  <div className="flex flex-wrap gap-x-3 mt-0.5">
                    {storeInfo.phone && <p className="text-xs text-muted-foreground">{storeInfo.phone}</p>}
                    {storeInfo.email && <p className="text-xs text-muted-foreground">{storeInfo.email}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={save} disabled={!dirty} className="gap-2 h-9">
              <Save className="w-3.5 h-3.5" />
              {dirty ? 'Enregistrer' : 'Aucune modification'}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Enregistré
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* App info */}
      <Card className="border shadow-none">
        <CardHeader className="px-5 py-4 border-b">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            Informations système
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <div className="divide-y divide-border">
            {[
              { icon: Database, label: 'Stockage données', value: 'Navigateur (localStorage)' },
              { icon: ShieldCheck, label: 'Authentification', value: 'PostgreSQL · better-auth' },
              { icon: Coins, label: 'Devise', value: 'Franc CFA (XAF)' },
              { icon: Globe, label: 'Région', value: 'République Centrafricaine' },
              { icon: Clock, label: 'Fuseau horaire', value: 'Afrique/Bangui (UTC+1)' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-sm">{label}</span>
                </div>
                <span className="text-sm font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            Aucune donnée transmise à des serveurs tiers
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border shadow-none">
        <CardContent className="px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-black text-base">M</span>
            </div>
            <div>
              <p className="font-bold">Mbongo</p>
              <p className="text-xs text-muted-foreground">v1.0 · République Centrafricaine</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Logiciel de gestion de caisse, de stock et de facturation conçu pour les commerçants d'Afrique centrale.
            Le nom <span className="font-semibold text-foreground">«&nbsp;Mbongo&nbsp;»</span> désigne la monnaie en sango, la langue nationale de la RCA.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
