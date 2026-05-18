export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

const handler = toNextJsHandler(auth.handler)

export async function GET(req: Request) {
  try {
    return await handler.GET(req)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[auth GET]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    return await handler.POST(req)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[auth POST]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
