// Cloudflare Pages Function — GET /api/health
export function onRequestGet() {
  return Response.json({ status: 'ok', ts: Date.now() })
}
