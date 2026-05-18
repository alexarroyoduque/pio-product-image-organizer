import { LitElement, html, css } from 'lit'
import { I18nMixin, t, setLocale, getLocale, LANGS, APP_TITLE } from './i18n.js'
import './pio-login.js'
import './pio-sidebar.js'
import './pio-photo-grid.js'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function pad(n, width = 3) {
  return String(n).padStart(width, '0')
}

function extOf(filename) {
  const m = filename.match(/(\.[^.]+)$/)
  return m ? m[1].toLowerCase() : ''
}

export class PioApp extends I18nMixin(LitElement) {
  static properties = {
    photos: { type: Array },
    sections: { type: Array },
    selectedNodeId: { type: String },
    dragPhotoId: { type: String },
    _toast: { type: String },
    _langOpen: { type: Boolean },
    _templates: { type: Array },
    _session: { type: Object },
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #0f1117;
      color: #e2e8f0;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* ───── HEADER ───── */
    header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 20px;
      height: 62px;
      background: #161b27;
      border-bottom: 1px solid #1e2535;
      flex-shrink: 0;
    }
    .logo {
      font-weight: 700;
      font-size: 20px;
      letter-spacing: -0.5px;
      color: #fff;
    }
    .logo span { color: #4f8ef7; }
    .spacer { flex: 1; }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 16px;
      border-radius: 8px;
      border: none;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      white-space: nowrap;
    }
    .btn:active { transform: scale(0.97); }
    .btn-primary {
      background: #4f8ef7;
      color: #fff;
    }
    .btn-primary:hover { background: #3b7de8; }
    .btn-success {
      background: #22c55e;
      color: #fff;
    }
    .btn-success:hover { background: #16a34a; }
    .btn-ghost {
      background: transparent;
      color: #94a3b8;
      border: 1px solid #2d3748;
    }
    .btn-ghost:hover { background: #1e2535; color: #e2e8f0; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ───── USER CHIP ───── */
    .user-chip {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 10px;
      border-radius: 8px;
      background: #0f1117;
      border: 1px solid #1e2535;
      font-size: 13px;
      color: #64748b;
      max-width: 200px;
      overflow: hidden;
    }
    .user-email {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .btn-logout {
      background: transparent;
      border: none;
      color: #4a5568;
      cursor: pointer;
      padding: 3px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      transition: color 0.12s;
      flex-shrink: 0;
    }
    .btn-logout:hover { color: #f87171; }

    /* ───── LANG SELECTOR ───── */
    .lang-wrapper {
      position: relative;
    }
    .lang-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 11px;
      border-radius: 8px;
      border: 1px solid #2d3748;
      background: transparent;
      color: #94a3b8;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .lang-btn:hover { background: #1e2535; color: #e2e8f0; }
    .lang-flag { font-size: 18px; line-height: 1; }
    .lang-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      background: #1e2535;
      border: 1px solid #2d3748;
      border-radius: 10px;
      padding: 6px;
      z-index: 600;
      min-width: 160px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    }
    .lang-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #94a3b8;
      transition: background 0.1s, color 0.1s;
    }
    .lang-option:hover { background: #2d3748; color: #e2e8f0; }
    .lang-option.active { color: #7eb3ff; background: #1e3a5f; }

    /* ───── BODY ───── */
    .body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ───── TOAST ───── */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #22c55e;
      color: #fff;
      padding: 11px 22px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
      z-index: 999;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    }

    /* hidden file input */
    input[type="file"] { display: none; }
  `

  constructor() {
    super()
    this.photos = []
    this.sections = []
    this.selectedNodeId = 'unassigned'
    this.dragPhotoId = null
    this._toast = ''
    this._langOpen = false
    this._templates = JSON.parse(localStorage.getItem('pio-templates') || '[]')
    this._session = this._loadSession()
    this._boundCloseLang = () => { this._langOpen = false }
  }

  // ── Session ──────────────────────────────────────────
  _loadSession() {
    try {
      const raw = localStorage.getItem('pio-session')
      if (!raw) return null
      const s = JSON.parse(raw)
      // Sessions expire after 30 days
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
      if (Date.now() - (s.validatedAt ?? 0) > THIRTY_DAYS) {
        localStorage.removeItem('pio-session')
        return null
      }
      return s
    } catch { return null }
  }

  _onSessionEstablished(e) {
    this._session = e.detail
  }

  _logout() {
    localStorage.removeItem('pio-session')
    this._session = null
  }

  // ──────────────────────────────────────────────
  // PHOTOS
  // ──────────────────────────────────────────────

  connectedCallback() {
    super.connectedCallback()
    document.addEventListener('click', this._boundCloseLang)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    document.removeEventListener('click', this._boundCloseLang)
  }

  _onImportClick() {
    this.shadowRoot.querySelector('#fileInput').click()
  }

  _onFilesSelected(e) {
    const files = Array.from(e.target.files)
    const newPhotos = files.map(f => ({
      id: uid(),
      name: f.name,
      file: f,
      url: URL.createObjectURL(f),
      sectionId: null,
      subsectionId: null,
    }))
    this.photos = [...this.photos, ...newPhotos]
    e.target.value = ''
    const n = newPhotos.length
    this._showToast(`${n} ${n === 1 ? t('toastImported') : t('toastImportedPlural')}`)
  }

  // ──────────────────────────────────────────────
  // SECTIONS
  // ──────────────────────────────────────────────

  _onAddSection(e) {
    const name = e.detail.name.trim()
    if (!name) return
    const section = { id: uid(), name, subsections: [] }
    this.sections = [...this.sections, section]
    this.selectedNodeId = section.id
  }

  _onAddSubsection(e) {
    const { sectionId, name } = e.detail
    const sub = { id: uid(), name: name.trim() }
    this.sections = this.sections.map(s =>
      s.id === sectionId ? { ...s, subsections: [...s.subsections, sub] } : s
    )
    this.selectedNodeId = sub.id
  }

  _onRenameSection(e) {
    const { id, name } = e.detail
    this.sections = this.sections.map(s => {
      if (s.id === id) return { ...s, name }
      const sub = s.subsections.find(ss => ss.id === id)
      if (sub) return { ...s, subsections: s.subsections.map(ss => ss.id === id ? { ...ss, name } : ss) }
      return s
    })
  }

  _onDeleteNode(e) {
    const { id } = e.detail
    // Check if it's a section
    const isSection = this.sections.some(s => s.id === id)
    if (isSection) {
      // Unassign all photos that were in this section
      this.photos = this.photos.map(p =>
        p.sectionId === id ? { ...p, sectionId: null, subsectionId: null } : p
      )
      this.sections = this.sections.filter(s => s.id !== id)
    } else {
      // It's a subsection — unassign photos in it
      this.photos = this.photos.map(p =>
        p.subsectionId === id ? { ...p, subsectionId: null, sectionId: this._parentSectionId(id) } : p
      )
      this.sections = this.sections.map(s => ({
        ...s,
        subsections: s.subsections.filter(ss => ss.id !== id),
      }))
    }
    if (this.selectedNodeId === id) this.selectedNodeId = 'unassigned'
  }

  _parentSectionId(subsectionId) {
    for (const s of this.sections) {
      if (s.subsections.some(ss => ss.id === subsectionId)) return s.id
    }
    return null
  }

  _onSelectNode(e) {
    this.selectedNodeId = e.detail.id
  }

  // ──────────────────────────────────────────────
  // DRAG & DROP assignment
  // ──────────────────────────────────────────────

  _onPhotoDragStart(e) {
    this.dragPhotoId = e.detail.id
  }

  _onDropOnNode(e) {
    const { nodeId } = e.detail
    if (!this.dragPhotoId) return
    if (nodeId === 'unassigned') {
      this.photos = this.photos.map(p =>
        p.id === this.dragPhotoId ? { ...p, sectionId: null, subsectionId: null } : p
      )
    } else {
      // Figure out if nodeId is section or subsection
      let sectionId = null
      let subsectionId = null
      for (const s of this.sections) {
        if (s.id === nodeId) { sectionId = s.id; break }
        const sub = s.subsections.find(ss => ss.id === nodeId)
        if (sub) { sectionId = s.id; subsectionId = sub.id; break }
      }
      this.photos = this.photos.map(p =>
        p.id === this.dragPhotoId ? { ...p, sectionId, subsectionId } : p
      )
    }
    this.dragPhotoId = null
  }

  _onAssignPhoto(e) {
    const { photoId, sectionId, subsectionId } = e.detail
    this.photos = this.photos.map(p =>
      p.id === photoId ? { ...p, sectionId: sectionId ?? null, subsectionId: subsectionId ?? null } : p
    )
  }

  _onUnassignPhoto(e) {
    const { photoId } = e.detail
    this.photos = this.photos.map(p =>
      p.id === photoId ? { ...p, sectionId: null, subsectionId: null } : p
    )
  }

  _onRemovePhoto(e) {
    const { photoId } = e.detail
    const photo = this.photos.find(p => p.id === photoId)
    if (photo) URL.revokeObjectURL(photo.url)
    this.photos = this.photos.filter(p => p.id !== photoId)
  }

  // ──────────────────────────────────────────────
  // REORDER
  // ──────────────────────────────────────────────

  _onReorderPhotos(e) {
    const { fromId, toId } = e.detail
    if (fromId === toId) return
    const arr = [...this.photos]
    const fromIdx = arr.findIndex(p => p.id === fromId)
    const [moved] = arr.splice(fromIdx, 1)
    const toIdx = arr.findIndex(p => p.id === toId)
    arr.splice(toIdx, 0, moved)
    this.photos = arr
  }

  // ──────────────────────────────────────────────
  // TEMPLATES
  // ──────────────────────────────────────────────

  _onSaveTemplate(e) {
    const { name } = e.detail
    const tpl = {
      id: uid(),
      name,
      sections: this.sections.map(s => ({
        name: s.name,
        subsections: s.subsections.map(ss => ({ name: ss.name }))
      }))
    }
    this._templates = [...this._templates, tpl]
    localStorage.setItem('pio-templates', JSON.stringify(this._templates))
    this._showToast(t('toastTemplateSaved'))
  }

  _onApplyTemplate(e) {
    const { templateId } = e.detail
    const tpl = this._templates.find(t => t.id === templateId)
    if (!tpl) return
    const newSections = tpl.sections.map(s => ({
      id: uid(),
      name: s.name,
      subsections: s.subsections.map(ss => ({ id: uid(), name: ss.name }))
    }))
    this.sections = [...this.sections, ...newSections]
    this._showToast(t('toastTemplateApplied'))
  }

  _onDeleteTemplate(e) {
    const { templateId } = e.detail
    this._templates = this._templates.filter(tmpl => tmpl.id !== templateId)
    localStorage.setItem('pio-templates', JSON.stringify(this._templates))
  }

  // ──────────────────────────────────────────────
  // EXPORT / RENAME
  // ──────────────────────────────────────────────

  get _assignedCount() {
    return this.photos.filter(p => p.sectionId).length
  }

  async _onExport() {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    for (const section of this.sections) {
      const sSlug = slugify(section.name)

      // Photos directly in section (no subsection)
      const directPhotos = this.photos.filter(p => p.sectionId === section.id && !p.subsectionId)
      for (let i = 0; i < directPhotos.length; i++) {
        const p = directPhotos[i]
        const ext = extOf(p.name)
        const newName = `${sSlug}-${pad(i + 1)}${ext}`
        zip.file(newName, p.file)
      }

      // Photos in subsections
      for (const sub of section.subsections) {
        const subSlug = slugify(sub.name)
        const subPhotos = this.photos.filter(p => p.sectionId === section.id && p.subsectionId === sub.id)
        for (let i = 0; i < subPhotos.length; i++) {
          const p = subPhotos[i]
          const ext = extOf(p.name)
          const newName = `${sSlug}-${subSlug}-${pad(i + 1)}${ext}`
          zip.file(newName, p.file)
        }
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = t('zipFilename')
    a.click()
    URL.revokeObjectURL(a.href)
    this._showToast(t('toastExported'))
  }

  // ──────────────────────────────────────────────
  // UI helpers
  // ──────────────────────────────────────────────

  _showToast(msg) {
    this._toast = msg
    clearTimeout(this._toastTimer)
    this._toastTimer = setTimeout(() => { this._toast = '' }, 3000)
  }

  // ──────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────

  render() {
    // ── AUTH GATE ─────────────────────────────────────────
    if (!this._session) {
      return html`<pio-login @session-established=${this._onSessionEstablished}></pio-login>`
    }

    const assigned = this._assignedCount
    const total = this.photos.length
    const currentLang = LANGS.find(l => l.code === getLocale()) ?? LANGS[0]
    return html`
      <header>
        <div class="logo">PIO <span>·</span> Product Image Organizer</div>
        <div class="spacer"></div>
        <button class="btn btn-ghost" @click=${this._onImportClick}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          ${t('importPhotos')}
        </button>
        <button class="btn btn-success" @click=${this._onExport} ?disabled=${assigned === 0}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          ${t('exportRename')}
          ${total > 0 ? html`<span style="opacity:0.75;font-size:13px;">(${assigned}/${total})</span>` : ''}
        </button>

        <!-- User chip + logout -->
        <div class="user-chip" .title=${t('loggedAs') + ' ' + this._session.email}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          <span class="user-email">${this._session.email}</span>
          <button class="btn-logout" .title=${t('logout')} @click=${this._logout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
        <div class="lang-wrapper">
          <button
            class="lang-btn"
            @click=${e => { e.stopPropagation(); this._langOpen = !this._langOpen }}
          >
            <span class="lang-flag">${currentLang.flag}</span>
            <span>${currentLang.code.toUpperCase()}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          ${this._langOpen ? html`
            <div class="lang-dropdown" @click=${e => e.stopPropagation()}>
              ${LANGS.map(l => html`
                <div
                  class="lang-option ${l.code === getLocale() ? 'active' : ''}"
                  @click=${() => { setLocale(l.code); this._langOpen = false }}
                >
                  <span style="font-size:18px">${l.flag}</span>
                  <span>${l.label}</span>
                </div>
              `)}
            </div>
          ` : ''}
        </div>

        <input
          type="file"
          id="fileInput"
          accept="image/*"
          multiple
          @change=${this._onFilesSelected}
        />
      </header>

      <div class="body">
        <pio-sidebar
          .sections=${this.sections}
          .photos=${this.photos}
          .templates=${this._templates}
          .selectedNodeId=${this.selectedNodeId}
          @add-section=${this._onAddSection}
          @add-subsection=${this._onAddSubsection}
          @rename-node=${this._onRenameSection}
          @delete-node=${this._onDeleteNode}
          @select-node=${this._onSelectNode}
          @drop-on-node=${this._onDropOnNode}
          @save-template=${this._onSaveTemplate}
          @apply-template=${this._onApplyTemplate}
          @delete-template=${this._onDeleteTemplate}
        ></pio-sidebar>

        <pio-photo-grid
          .photos=${this.photos}
          .sections=${this.sections}
          .selectedNodeId=${this.selectedNodeId}
          @photo-drag-start=${this._onPhotoDragStart}
          @assign-photo=${this._onAssignPhoto}
          @unassign-photo=${this._onUnassignPhoto}
          @remove-photo=${this._onRemovePhoto}
          @reorder-photos=${this._onReorderPhotos}
        ></pio-photo-grid>
      </div>

      ${this._toast ? html`<div class="toast">${this._toast}</div>` : ''}
    `
  }
}

customElements.define('pio-app', PioApp)
