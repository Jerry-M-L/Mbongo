// Proxy HTTPS → Next.js dev server
// Usage: node https-proxy.mjs [next-port]
import https from 'https'
import http from 'http'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import net from 'net'

const __dir = dirname(fileURLToPath(import.meta.url))
const HTTPS_PORT = 3443
const NEXT_PORT = parseInt(process.argv[2] ?? '3001')

const ssl = {
  key:  readFileSync(resolve(__dir, 'certs/key.pem')),
  cert: readFileSync(resolve(__dir, 'certs/cert.pem')),
}

const proxy = https.createServer(ssl, (req, res) => {
  const opts = {
    hostname: 'localhost',
    port: NEXT_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${NEXT_PORT}` },
  }
  const upstream = http.request(opts, (upRes) => {
    res.writeHead(upRes.statusCode ?? 200, upRes.headers)
    upRes.pipe(res)
  })
  upstream.on('error', () => res.end())
  req.pipe(upstream)
})

// WebSocket tunnel (HMR)
proxy.on('upgrade', (req, socket, head) => {
  const upstream = net.connect(NEXT_PORT, 'localhost', () => {
    upstream.write(
      `${req.method} ${req.url} HTTP/1.1\r\n` +
      Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
      '\r\n\r\n'
    )
    upstream.write(head)
    socket.pipe(upstream).pipe(socket)
  })
  upstream.on('error', () => socket.destroy())
})

proxy.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log(`\n✅ Proxy HTTPS prêt`)
  console.log(`   Local  : https://localhost:${HTTPS_PORT}`)

  // Afficher l'IP locale
  import('os').then(({ default: os }) => {
    const nets = os.networkInterfaces()
    for (const iface of Object.values(nets)) {
      for (const n of iface ?? []) {
        if (n.family === 'IPv4' && !n.internal) {
          console.log(`   Réseau : https://${n.address}:${HTTPS_PORT}`)
        }
      }
    }
    console.log(`\n📱 Sur votre téléphone, ouvrez l'URL "Réseau" ci-dessus.`)
    console.log(`   Le navigateur affichera un avertissement de sécurité.`)
    console.log(`   Cliquez "Avancé" → "Continuer quand même" pour accepter.\n`)
  })
})
