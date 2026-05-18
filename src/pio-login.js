import { LitElement, html, css } from 'lit'
import { I18nMixin, t, LANGS, getLocale, setLocale } from './i18n.js'

// Error code → i18n key mapping
const ERROR_KEY = {
  missing_fields:        'errMissingFields',
  invalid_key:           'errInvalidKey',
  inactive_key:          'errInactiveKey',
  email_mismatch:        'errEmailMismatch',
  server_error:          'errServerError',
  server_not_configured: 'errServerNotConfigured',
  network:               'errNetwork',
}

export class PioLogin extends I18nMixin(LitElement) {
  static properties = {
    _email:    { type: String },
    _key:      { type: String },
    _loading:  { type: Boolean },
    _error:    { type: String },
    _langOpen: { type: Boolean },
  }

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #0f1117;
      font-family: 'Inter', system-ui, sans-serif;
      color: #e2e8f0;
    }

    /* ── Card ── */
    .card {
      width: 440px;
      max-width: calc(100vw - 32px);
      background: #161b27;
      border: 1px solid #1e2535;
      border-radius: 16px;
      padding: 40px 40px 36px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6);
    }

    /* ── Logo ── */
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
    }
    .logo-icon {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #4f8ef7 0%, #22c55e 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .logo-text .name {
      font-size: 18px;
      font-weight: 700;
      color: #fff;
      line-height: 1.2;
    }
    .logo-text .sub {
      font-size: 11px;
      color: #4a5568;
      letter-spacing: 0.3px;
    }

    /* ── Heading ── */
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 8px;
    }
    .subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 28px;
      line-height: 1.5;
    }

    /* ── Form ── */
    .field {
      margin-bottom: 18px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    input {
      width: 100%;
      box-sizing: border-box;
      background: #0f1117;
      border: 1px solid #2d3748;
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 15px;
      padding: 11px 14px;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: inherit;
    }
    input:focus {
      border-color: #4f8ef7;
      box-shadow: 0 0 0 3px rgba(79,142,247,0.2);
    }
    input::placeholder { color: #374151; }
    input:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Key input: monospace for the license code */
    input.mono {
      font-family: 'SF Mono', 'Fira Code', 'Fira Mono', monospace;
      letter-spacing: 0.05em;
    }

    /* ── Activate button ── */
    .btn-activate {
      width: 100%;
      padding: 13px;
      background: linear-gradient(135deg, #4f8ef7 0%, #22c55e 100%);
      border: none;
      border-radius: 9px;
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
      transition: opacity 0.15s, transform 0.1s;
    }
    .btn-activate:hover:not(:disabled) { opacity: 0.9; }
    .btn-activate:active:not(:disabled) { transform: scale(0.98); }
    .btn-activate:disabled { opacity: 0.45; cursor: not-allowed; }

    /* Spinner */
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Error message ── */
    .error-bar {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: #2d1b1b;
      border: 1px solid #7f1d1d;
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 16px;
      font-size: 13px;
      color: #fca5a5;
      line-height: 1.4;
    }

    /* ── AppSumo badge ── */
    .as-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 24px;
      font-size: 12px;
      color: #374151;
    }
    .as-badge svg { opacity: 0.5; }

    /* ── Language selector (top-right of card) ── */
    .lang-wrapper {
      position: relative;
      float: right;
      margin-top: -4px;
      margin-right: -4px;
    }
    .lang-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 9px;
      border-radius: 7px;
      border: 1px solid #2d3748;
      background: transparent;
      color: #64748b;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.12s, color 0.12s;
    }
    .lang-btn:hover { background: #1e2535; color: #94a3b8; }
    .lang-flag { font-size: 16px; line-height: 1; }
    .lang-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      background: #1e2535;
      border: 1px solid #2d3748;
      border-radius: 10px;
      padding: 6px;
      z-index: 100;
      min-width: 150px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    }
    .lang-option {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 7px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      color: #94a3b8;
      transition: background 0.1s, color 0.1s;
    }
    .lang-option:hover { background: #2d3748; color: #e2e8f0; }
    .lang-option.active { color: #7eb3ff; background: #1e3a5f; }
  `

  constructor() {
    super()
    this._email   = ''
    this._key     = ''
    this._loading = false
    this._error   = ''
    this._langOpen = false
    this._boundClose = () => { this._langOpen = false }
  }

  connectedCallback() {
    super.connectedCallback()
    document.addEventListener('click', this._boundClose)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    document.removeEventListener('click', this._boundClose)
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async _onSubmit(e) {
    e?.preventDefault()
    const email = this._email.trim()
    const key   = this._key.trim()

    if (!email || !key) {
      this._error = 'missing_fields'
      return
    }

    this._loading = true
    this._error   = ''

    try {
      const res = await fetch('/api/validate-license', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, licenseKey: key }),
      })

      const data = await res.json()

      if (!res.ok || !data.valid) {
        this._error = data.error ?? 'server_error'
        return
      }

      // Build session object
      const session = {
        email:       data.email,
        plan:        data.plan,
        validatedAt: Date.now(),
      }
      localStorage.setItem('pio-session', JSON.stringify(session))

      this.dispatchEvent(new CustomEvent('session-established', {
        detail: session, bubbles: true, composed: true,
      }))
    } catch {
      this._error = 'network'
    } finally {
      this._loading = false
    }
  }

  _onKeydown(e) {
    if (e.key === 'Enter') this._onSubmit()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    const currentLang = LANGS.find(l => l.code === getLocale()) ?? LANGS[0]
    const errorMsg = this._error ? t(ERROR_KEY[this._error] ?? 'errServerError') : ''

    return html`
      <div class="card">

        <!-- Language selector -->
        <div class="lang-wrapper">
          <button
            class="lang-btn"
            @click=${e => { e.stopPropagation(); this._langOpen = !this._langOpen }}
          >
            <span class="lang-flag">${currentLang.flag}</span>
            <span>${currentLang.code.toUpperCase()}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          ${this._langOpen ? html`
            <div class="lang-dropdown" @click=${e => e.stopPropagation()}>
              ${LANGS.map(l => html`
                <div
                  class="lang-option ${l.code === getLocale() ? 'active' : ''}"
                  @click=${() => { setLocale(l.code); this._langOpen = false }}
                >
                  <span style="font-size:16px">${l.flag}</span>
                  <span>${l.label}</span>
                </div>
              `)}
            </div>
          ` : ''}
        </div>

        <!-- Logo -->
        <div class="logo">
          <div class="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <div class="logo-text">
            <div class="name">PIO</div>
            <div class="sub">Product Image Organizer</div>
          </div>
        </div>

        <!-- Heading -->
        <h1>${t('loginTitle')}</h1>
        <p class="subtitle">${t('loginSubtitle')}</p>

        <!-- Form -->
        <form @submit=${this._onSubmit}>
          <div class="field">
            <label for="pio-email">${t('email')}</label>
            <input
              id="pio-email"
              type="email"
              autocomplete="email"
              .placeholder=${t('emailPlaceholder')}
              .value=${this._email}
              ?disabled=${this._loading}
              @input=${e => { this._email = e.target.value }}
              @keydown=${this._onKeydown}
            />
          </div>

          <div class="field">
            <label for="pio-key">${t('licenseKey')}</label>
            <input
              id="pio-key"
              class="mono"
              type="text"
              autocomplete="off"
              spellcheck="false"
              .placeholder=${t('licenseKeyPlaceholder')}
              .value=${this._key}
              ?disabled=${this._loading}
              @input=${e => { this._key = e.target.value.toUpperCase() }}
              @keydown=${this._onKeydown}
            />
          </div>

          <button class="btn-activate" type="submit" ?disabled=${this._loading}>
            ${this._loading
              ? html`<span class="spinner"></span> ${t('activating')}`
              : html`
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                  ${t('activate')}
                `}
          </button>
        </form>

        ${errorMsg ? html`
          <div class="error-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            ${errorMsg}
          </div>
        ` : ''}

        <!-- AppSumo badge -->
        <div class="as-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Powered by AppSumo · License required
        </div>
      </div>
    `
  }
}

customElements.define('pio-login', PioLogin)
