import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const IS_PROD = process.env.NODE_ENV === 'production'

// ─── AppSumo API endpoints ────────────────────────────────────────────────────
// Adjust these if AppSumo changes their API base URLs.
const APPSUMO_TOKEN_URL = 'https://appsumo.com/openid/token/'
const APPSUMO_API_BASE  = 'https://appsumo8.com/api/v1'

// ─── CORS ──────────────────────────────────────────────────────────────────────
// In production the server serves the static files itself, so no cross-origin
// requests need to be permitted. In dev, Vite runs on 5173 and proxies /api.
const allowedOrigins = IS_PROD
  ? false   // same-origin only
  : [process.env.ALLOWED_ORIGIN || 'http://localhost:5173']

if (!IS_PROD) {
  app.use(cors({ origin: allowedOrigins, credentials: true }))
}

app.use(express.json())

// ─── AppSumo token cache ───────────────────────────────────────────────────────
let _cachedToken   = null
let _tokenExpiry   = 0

async function getAppSumoToken() {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken

  const params = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     process.env.APPSUMO_CLIENT_ID,
    client_secret: process.env.APPSUMO_CLIENT_SECRET,
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
  // Subtract 60 s as buffer before actual expiry
  _tokenExpiry = Date.now() + ((data.expires_in ?? 3600) - 60) * 1000
  return _cachedToken
}

async function fetchLicenseFromAppSumo(licenseKey) {
  const token = await getAppSumoToken()
  const res = await fetch(`${APPSUMO_API_BASE}/license-keys/${encodeURIComponent(licenseKey)}/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AppSumo license API error ${res.status}: ${text}`)
  }
  return res.json()
}

// ─── POST /api/validate-license ───────────────────────────────────────────────
app.post('/api/validate-license', async (req, res) => {
  const { email, licenseKey } = req.body ?? {}

  if (!email?.trim() || !licenseKey?.trim()) {
    return res.status(400).json({ valid: false, error: 'missing_fields' })
  }

  // ── Development / demo bypass ──────────────────────────────────────────────
  // Set DEMO_LICENSE_KEY in .env to test the full UI flow without real
  // AppSumo credentials during development.
  if (
    process.env.DEMO_LICENSE_KEY &&
    licenseKey.trim().toUpperCase() === process.env.DEMO_LICENSE_KEY.toUpperCase()
  ) {
    return res.json({ valid: true, plan: 'demo', email: email.trim().toLowerCase() })
  }

  // ── Guard: credentials must be configured ─────────────────────────────────
  if (!process.env.APPSUMO_CLIENT_ID || !process.env.APPSUMO_CLIENT_SECRET) {
    console.error('[PIO] APPSUMO_CLIENT_ID / APPSUMO_CLIENT_SECRET not set in .env')
    return res.status(500).json({ valid: false, error: 'server_not_configured' })
  }

  try {
    const license = await fetchLicenseFromAppSumo(licenseKey.trim())

    if (!license) {
      return res.json({ valid: false, error: 'invalid_key' })
    }

    // ── Status check ─────────────────────────────────────────────────────────
    // AppSumo statuses: "active" | "inactive" | "refunded"
    if (license.status !== 'active') {
      return res.json({ valid: false, error: 'inactive_key' })
    }

    // ── Email match ──────────────────────────────────────────────────────────
    // activation_email is the AppSumo account email used to purchase.
    const purchaseEmail = (license.activation_email ?? '').toLowerCase().trim()
    const inputEmail    = email.trim().toLowerCase()
    if (purchaseEmail && purchaseEmail !== inputEmail) {
      return res.json({ valid: false, error: 'email_mismatch' })
    }

    return res.json({
      valid:  true,
      plan:   license.plan_id ?? 'standard',
      email:  inputEmail,
    })
  } catch (err) {
    console.error('[PIO] License validation error:', err.message)
    return res.status(500).json({ valid: false, error: 'server_error' })
  }
})

// ─── Health check (Railway uses this to know the app is up) ─────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: Date.now() })
})

// ─── Serve built Vite app in production ───────────────────────────────────────
if (IS_PROD) {
  const distPath = join(__dirname, '../dist')
  if (!existsSync(distPath)) {
    console.warn('[PIO] dist/ folder not found — run `npm run build` first')
  }
  app.use(express.static(distPath))
  // SPA fallback — must come AFTER /api routes
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(join(distPath, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`[PIO] Server running on http://localhost:${PORT} (${IS_PROD ? 'production' : 'development'})`)
})
