export const dynamic = 'force-dynamic'

import type { NextRequest } from 'next/server'

let handler: { GET: (r: Request) => Promise<Response>; POST: (r: Request) => Promise<Response> } | null = null
let initError: string | null = null

try {
  const { auth } = require('@/lib/auth')
  const { toNextJsHandler } = require('better-auth/next-js')
  handler = toNextJsHandler(auth.handler)
} catch (e) {
  initError = e instanceof Error ? `${e.message}\n${(e as Error).stack}` : String(e)
  console.error('[auth init error]', initError)
}

export async function GET(req: NextRequest) {
  if (!handler) return Response.json({ error: initError }, { status: 500 })
  try { return await handler.GET(req) }
  catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[auth GET]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!handler) return Response.json({ error: initError }, { status: 500 })
  try { return await handler.POST(req) }
  catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[auth POST]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
