'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScanBarcode, CameraOff, RefreshCw, FlipHorizontal } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onDetected: (barcode: string) => void
}

export function BarcodeScanner({ open, onClose, onDetected }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [camIndex, setCamIndex] = useState(0)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<InstanceType<typeof import('html5-qrcode').Html5Qrcode> | null>(null)
  const containerId = 'qr-reader-container'

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.stop() } catch { /* ignore */ }
    }
    setScanning(false)
  }

  const startScanner = async (cameraId: string) => {
    if (!scannerRef.current) return
    await stopScanner()
    setError(null)
    try {
      await scannerRef.current.start(
        cameraId,
        { fps: 15, qrbox: { width: 260, height: 140 }, aspectRatio: 1.6 },
        (decoded) => {
          setScanning(false)
          onDetected(decoded.trim())
          onClose()
        },
        () => { /* scan error — ignore */ }
      )
      setScanning(true)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg.includes('Permission') ? 'Accès à la caméra refusé. Autorisez l\'accès dans les paramètres du navigateur.' : 'Impossible de démarrer la caméra.')
    }
  }

  useEffect(() => {
    if (!open) { stopScanner(); return }

    let mounted = true
    ;(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const devices = await Html5Qrcode.getCameras()
        if (!mounted) return
        if (!devices.length) { setError('Aucune caméra détectée.'); return }

        // prefer back camera
        const idx = devices.findIndex((d) =>
          /back|rear|arrière|environment/i.test(d.label)
        )
        const preferred = idx >= 0 ? idx : 0
        setCameras(devices)
        setCamIndex(preferred)

        scannerRef.current = new Html5Qrcode(containerId)
        startScanner(devices[preferred].id)
      } catch {
        if (mounted) setError('Impossible d\'accéder à la caméra.')
      }
    })()

    return () => { mounted = false; stopScanner() }
  }, [open])

  const switchCamera = async () => {
    if (cameras.length < 2) return
    const next = (camIndex + 1) % cameras.length
    setCamIndex(next)
    await startScanner(cameras[next].id)
  }

  const handleClose = () => { stopScanner(); onClose() }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ScanBarcode className="w-4 h-4 text-primary" />
            Scanner un code-barres
          </DialogTitle>
        </DialogHeader>

        {/* Camera viewport */}
        <div className="relative bg-black" style={{ minHeight: 240 }}>
          <div id={containerId} className="w-full" />

          {/* Scan overlay frame */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-36">
                {/* corners */}
                {[['top-0 left-0', 'border-t-2 border-l-2'],
                  ['top-0 right-0', 'border-t-2 border-r-2'],
                  ['bottom-0 left-0', 'border-b-2 border-l-2'],
                  ['bottom-0 right-0', 'border-b-2 border-r-2'],
                ].map(([pos, border]) => (
                  <div key={pos} className={`absolute ${pos} w-6 h-6 ${border} border-primary rounded-sm`} />
                ))}
                {/* scan line */}
                <div className="absolute left-2 right-2 h-0.5 bg-primary/70 animate-[scanline_2s_ease-in-out_infinite]" style={{ top: '50%' }} />
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
              <CameraOff className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-white">{error}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {scanning ? 'Pointez vers le code-barres…' : error ? 'Erreur caméra' : 'Démarrage…'}
          </p>
          <div className="flex gap-2">
            {cameras.length > 1 && (
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={switchCamera}>
                <FlipHorizontal className="w-3.5 h-3.5" />
                {cameras[camIndex]?.label?.includes('back') || cameras[camIndex]?.label?.includes('rear') ? 'Arrière' : 'Avant'}
              </Button>
            )}
            {error && (
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => cameras.length && startScanner(cameras[camIndex].id)}>
                <RefreshCw className="w-3.5 h-3.5" />
                Réessayer
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleClose}>
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
