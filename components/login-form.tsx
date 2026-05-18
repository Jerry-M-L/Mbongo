'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return }
    setLoading(true)
    const ok = await login(email, password)
    setLoading(false)
    if (!ok) setError('Email ou mot de passe incorrect')
  }

  /* ── shared form fields ─────────────────────────────────────── */
  const FormFields = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email" type="email"
            className="pl-10 h-12 text-base sm:h-11 sm:text-sm"
            placeholder="vous@boutique.cf"
            value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" inputMode="email"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Mot de passe</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password" type={showPwd ? 'text' : 'password'}
            className="pl-10 pr-10 h-12 text-base sm:h-11 sm:text-sm"
            placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button" tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            onClick={() => setShowPwd(!showPwd)}
          >
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full h-12 sm:h-11 font-semibold mt-1" disabled={loading}>
        {loading
          ? <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Connexion...
            </span>
          : 'Se connecter'}
      </Button>
    </form>
  )

  /* ══════════════════════════════════════════════════════════════
     MOBILE  (< sm 640px)
     Bannière sombre en haut → feuille blanche qui remonte par-dessus
  ══════════════════════════════════════════════════════════════ */
  const MobileLayout = () => (
    <div className="sm:hidden min-h-screen flex flex-col" style={{ background: 'var(--sidebar)' }}>
      {/* Décor */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 25% 40%, oklch(0.48 0.11 58 / 0.15) 0%, transparent 55%)' }} />

      {/* Bannière brand */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-14 pb-10 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
          <span className="text-primary-foreground font-black text-2xl">M</span>
        </div>
        <p className="text-xl font-extrabold tracking-tight" style={{ color: 'oklch(0.93 0.008 65)' }}>
          Mbongo
        </p>
        <p className="text-sm mt-1.5" style={{ color: 'oklch(0.48 0.022 55)' }}>
          Gestion de boutique · RCA
        </p>
      </div>

      {/* Feuille blanche */}
      <div className="relative z-10 flex-1 bg-background rounded-t-[28px] px-6 pt-8 pb-10 -mt-2">
        <div className="max-w-sm mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Connexion</h2>
            <p className="text-sm text-muted-foreground mt-1">Accédez à votre espace de gestion</p>
          </div>
          <FormFields />
          <p className="text-center text-xs text-muted-foreground mt-8">
            © 2026 Mbongo · République Centrafricaine
          </p>
        </div>
      </div>
    </div>
  )

  /* ══════════════════════════════════════════════════════════════
     TABLETTE  (sm 640px → lg 1024px)
     Fond sombre plein écran, card blanche centrée flottante
  ══════════════════════════════════════════════════════════════ */
  const TabletLayout = () => (
    <div
      className="hidden sm:flex lg:hidden min-h-screen flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{ background: 'oklch(0.11 0.014 55)' }}
    >
      {/* Décor */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 80%, oklch(0.48 0.11 58 / 0.16) 0%, transparent 50%),' +
            'radial-gradient(circle at 80% 15%, oklch(0.48 0.11 58 / 0.08) 0%, transparent 45%)',
        }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: 'linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }} />

      {/* Logo au-dessus de la card */}
      <div className="relative z-10 flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-black text-lg">M</span>
        </div>
        <span className="text-lg font-bold" style={{ color: 'oklch(0.90 0.012 65)' }}>Mbongo</span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-background rounded-2xl shadow-2xl px-8 py-9">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Connexion</h2>
          <p className="text-sm text-muted-foreground mt-1">Accédez à votre espace de gestion</p>
        </div>
        <FormFields />
      </div>

      <p className="relative z-10 text-xs mt-6" style={{ color: 'oklch(0.32 0.012 55)' }}>
        © 2026 Mbongo · République Centrafricaine
      </p>
    </div>
  )

  /* ══════════════════════════════════════════════════════════════
     DESKTOP  (lg 1024px+)
     Deux colonnes : panneau sombre à gauche, formulaire à droite
  ══════════════════════════════════════════════════════════════ */
  const DesktopLayout = () => (
    <div className="hidden lg:flex min-h-screen bg-background">
      {/* Panneau gauche */}
      <div
        className="lg:w-[440px] xl:w-[500px] 2xl:w-[600px] flex flex-col relative overflow-hidden flex-shrink-0"
        style={{ background: 'var(--sidebar)' }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, oklch(0.48 0.11 58 / 0.12) 0%, transparent 60%), radial-gradient(circle at 80% 20%, oklch(0.48 0.11 58 / 0.08) 0%, transparent 50%)' }} />

        <div className="relative z-10 flex flex-col h-full px-10 py-10 2xl:px-14 2xl:py-14 justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 2xl:w-10 2xl:h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-lg">M</span>
            </div>
            <span className="text-lg font-bold" style={{ color: 'oklch(0.90 0.012 65)' }}>Mbongo</span>
          </div>

          {/* Headline */}
          <div className="space-y-5 2xl:space-y-6">
            <div>
              <h1 className="text-4xl 2xl:text-5xl font-extrabold leading-tight tracking-tight" style={{ color: 'oklch(0.93 0.008 65)' }}>
                Gérez votre<br />boutique
              </h1>
              <p className="mt-3 2xl:mt-4 text-sm 2xl:text-base leading-relaxed" style={{ color: 'oklch(0.52 0.025 55)' }}>
                Caisse, stock, factures et clients — tout en un, conçu pour les commerçants de la RCA.
              </p>
            </div>
            <div className="space-y-2.5 2xl:space-y-3">
              {[
                'Point de vente avec scanner de codes-barres',
                'Gestion du stock et alertes de rupture',
                'Factures imprimables à tout moment',
                'Rapports de ventes et dépenses',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm 2xl:text-[15px]" style={{ color: 'oklch(0.60 0.022 58)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs 2xl:text-sm" style={{ color: 'oklch(0.38 0.018 55)' }}>
            © 2026 Mbongo · République Centrafricaine
          </p>
        </div>
      </div>

      {/* Panneau droit */}
      <div className="flex-1 flex items-center justify-center p-8 2xl:p-16">
        <div className="w-full max-w-sm 2xl:max-w-md">
          <div className="mb-7 2xl:mb-9">
            <h2 className="text-2xl 2xl:text-3xl font-bold tracking-tight">Connexion</h2>
            <p className="text-sm 2xl:text-base text-muted-foreground mt-1 2xl:mt-2">Accédez à votre espace de gestion</p>
          </div>
          <FormFields />
        </div>
      </div>
    </div>
  )

  return (
    <>
      <MobileLayout />
      <TabletLayout />
      <DesktopLayout />
    </>
  )
}
