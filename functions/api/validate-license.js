// Cloudflare Pages Function — POST /api/validate-license
// Env vars (set in Cloudflare dashboard or .dev.vars for local dev):
//   APPSUMO_CLIENT_ID, APPSUMO_CLIENT_SECRET, DEMO_LICENSE_KEY

const APPSUMO_TOKEN_URL = 'https://appsumo.com/openid/token/'
const APPSUMO_API_BASE  = 'https://appsumo8.com/api/v1'

// Module-level token cache — survives across warm Worker reuses
let _cachedToken = null
let _tokenExpiry = 0

async function getAppSumoToken(env) {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken

  const params = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     env.APPSUMO_CLIENT_ID,
    client_secret: env.APPSUMO_CLIENT_SECRET,
  })

  const res = await fetch(APPSUMO_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AppSumo token error ${res.status}: ${text}`)
  }

  const data = await res.json()
  _cachedToken = data.access_token
  _tokenExpiry = Date.now() + ((data.expires_in ?? 3600) - 60) * 1000
  return _cachedToken
}

async function fetchLicenseFromAppSumo(licenseKey, env) {
  const token = await getAppSumoToken(env)
  const res = await fetch(
    `${APPSUMO_API_BASE}/license-keys/${encodeURIComponent(licenseKey)}/`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AppSumo license API error ${res.status}: ${text}`)
  }
  return res.json()
}

export async function onRequestPost(context) {
  const { request, env } = context

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ valid: false, error: 'missing_fields' }, { status: 400 })
  }

  const email      = (body?.email ?? '').trim()
  const licenseKey = (body?.licenseKey ?? '').trim()

  if (!email || !licenseKey) {
    return Response.json({ valid: false, error: 'missing_fields' }, { status: 400 })
  }

  // ── Demo / development bypass ─────────────────────────────────────────────
  if (
    env.DEMO_LICENSE_KEY &&
    licenseKey.toUpperCase() === env.DEMO_LICENSE_KEY.toUpperCase()
  ) {
    return Response.json({ valid: true, plan: 'demo', email: email.toLowerCase() })
  }

  // ── Guard: credentials must be configured ─────────────────────────────────
  if (!env.APPSUMO_CLIENT_ID || !env.APPSUMO_CLIENT_SECRET) {
    console.error('[PIO] APPSUMO_CLIENT_ID / APPSUMO_CLIENT_SECRET not configured')
    return Response.json({ valid: false, error: 'server_not_configured' }, { status: 500 })
  }

  try {
    const license = await fetchLicenseFromAppSumo(licenseKey, env)

    if (!license) {
      return Response.json({ valid: false, error: 'invalid_key' })
    }

    if (license.status !== 'active') {
      return Response.json({ valid: false, error: 'inactive_key' })
    }

    const purchaseEmail = (license.activation_email ?? '').toLowerCase().trim()
    const inputEmail    = email.toLowerCase()
    if (purchaseEmail && purchaseEmail !== inputEmail) {
      return Response.json({ valid: false, error: 'email_mismatch' })
    }

    return Response.json({
      valid: true,
      plan:  license.plan_id ?? 'standard',
      email: inputEmail,
    })
  } catch (err) {
    console.error('[PIO] License validation error:', err.message)
    return Response.json({ valid: false, error: 'server_error' }, { status: 500 })
  }
}
