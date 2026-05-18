import { LitElement, html, css } from 'lit'
import { I18nMixin, t } from './i18n.js'

export class PioPhotoGrid extends I18nMixin(LitElement) {
  static properties = {
    photos: { type: Array },
    sections: { type: Array },
    selectedNodeId: { type: String },
    _menuPhotoId: { type: String },
    _menuX: { type: Number },
    _menuY: { type: Number },
    _dragFromPhotoId: { type: String },
    _dragOverPhotoId: { type: String },
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
      background: #0f1117;
    }

    /* ── View header ── */
    .view-header {
      padding: 14px 20px 10px;
      border-bottom: 1px solid #1e2535;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .view-title {
      font-size: 17px;
      font-weight: 600;
      color: #e2e8f0;
    }
    .view-subtitle {
      font-size: 14px;
      color: #4a5568;
    }
    .badge {
      background: #1e3a5f;
      color: #7eb3ff;
      border-radius: 10px;
      padding: 2px 10px;
      font-size: 13px;
      font-weight: 500;
    }

    /* ── Empty state ── */
    .empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #2d3748;
    }
    .empty svg { opacity: 0.3; }
    .empty p { font-size: 16px; }

    /* ── Photo grid ── */
    .grid-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }

    /* ── Photo card ── */
    .card {
      position: relative;
      border-radius: 10px;
      overflow: hidden;
      background: #161b27;
      border: 2px solid transparent;
      cursor: grab;
      transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
      aspect-ratio: 1;
    }
    .card:hover {
      border-color: #2d3748;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.5);
      z-index: 1;
    }
    .card:active { cursor: grabbing; }
    .card.dragging { opacity: 0.4; }
    .card.drop-target {
      border-color: #4f8ef7;
      box-shadow: 0 0 0 3px rgba(79,142,247,0.35);
    }

    .card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      pointer-events: none;
    }

    /* ── Card overlay ── */
    .card-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%);
      opacity: 0;
      transition: opacity 0.15s;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 8px;
      gap: 4px;
    }
    .card:hover .card-overlay { opacity: 1; }

    .card-name {
      font-size: 12px;
      color: #e2e8f0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .card-path {
      font-size: 11px;
      color: #4ade80;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-btns {
      position: absolute;
      top: 6px;
      right: 6px;
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.15s;
    }
    .card:hover .card-btns { opacity: 1; }

    .card-btn {
      background: rgba(0,0,0,0.7);
      border: none;
      color: #e2e8f0;
      border-radius: 5px;
      padding: 5px 7px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 3px;
      backdrop-filter: blur(4px);
      transition: background 0.12s;
    }
    .card-btn:hover { background: rgba(79,142,247,0.8); }
    .card-btn.remove:hover { background: rgba(248,113,113,0.8); }

    /* ── Context / assign menu ── */
    .assign-menu {
      position: fixed;
      background: #1e2535;
      border: 1px solid #2d3748;
      border-radius: 10px;
      padding: 6px;
      z-index: 500;
      min-width: 180px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    }
    .menu-section {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
      color: #4a5568;
      text-transform: uppercase;
      padding: 4px 8px 2px;
    }
    .menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #94a3b8;
      transition: background 0.1s, color 0.1s;
    }
    .menu-item:hover { background: #2d3748; color: #e2e8f0; }
    .menu-item.unassign { color: #f87171; }
    .menu-item.unassign:hover { background: #2d1b1b; }
    .menu-divider { height: 1px; background: #2d3748; margin: 4px 0; }

    /* ── Assignment badge on card ── */
    .assigned-badge {
      position: absolute;
      top: 6px;
      left: 6px;
      background: rgba(34,197,94,0.9);
      color: #fff;
      border-radius: 4px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 600;
      max-width: 80%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `

  constructor() {
    super()
    this.photos = []
    this.sections = []
    this.selectedNodeId = 'unassigned'
    this._menuPhotoId = null
    this._menuX = 0
    this._menuY = 0
    this._dragFromPhotoId = null
    this._dragOverPhotoId = null
    this._boundCloseMenu = this._closeMenu.bind(this)
  }

  connectedCallback() {
    super.connectedCallback()
    document.addEventListener('click', this._boundCloseMenu)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    document.removeEventListener('click', this._boundCloseMenu)
  }

  // ──────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────

  get _visiblePhotos() {
    const id = this.selectedNodeId
    if (!id || id === 'unassigned') return this.photos.filter(p => !p.sectionId)
    // Check if section
    const section = this.sections.find(s => s.id === id)
    if (section) return this.photos.filter(p => p.sectionId === id)
    // Subsection
    return this.photos.filter(p => p.subsectionId === id)
  }

  _labelFor(photo) {
    if (!photo.sectionId) return null
    const section = this.sections.find(s => s.id === photo.sectionId)
    if (!section) return null
    if (!photo.subsectionId) return section.name
    const sub = section.subsections.find(ss => ss.id === photo.subsectionId)
    return sub ? `${section.name} › ${sub.name}` : section.name
  }

  _viewTitle() {
    const id = this.selectedNodeId
    if (!id || id === 'unassigned') return t('unassigned')
    const section = this.sections.find(s => s.id === id)
    if (section) return section.name
    for (const s of this.sections) {
      const sub = s.subsections.find(ss => ss.id === id)
      if (sub) return `${s.name} › ${sub.name}`
    }
    return ''
  }

  // ──────────────────────────────────────────────
  // Drag
  // ──────────────────────────────────────────────

  _onDragStart(e, photoId) {
    e.dataTransfer.effectAllowed = 'move'
    this._dragFromPhotoId = photoId
    this.dispatchEvent(new CustomEvent('photo-drag-start', { detail: { id: photoId }, bubbles: true, composed: true }))
  }

  _onDragEnd() {
    this._dragFromPhotoId = null
    this._dragOverPhotoId = null
  }

  // Intra-grid reorder
  _onDragOverCard(e, photoId) {
    if (!this._dragFromPhotoId || this._dragFromPhotoId === photoId) return
    e.preventDefault()
    this._dragOverPhotoId = photoId
  }

  _onDragLeaveCard() {
    this._dragOverPhotoId = null
  }

  _onDropOnCard(e, photoId) {
    if (!this._dragFromPhotoId || this._dragFromPhotoId === photoId) return
    e.preventDefault()
    this.dispatchEvent(new CustomEvent('reorder-photos', {
      detail: { fromId: this._dragFromPhotoId, toId: photoId },
      bubbles: true, composed: true,
    }))
    this._dragFromPhotoId = null
    this._dragOverPhotoId = null
  }

  // ──────────────────────────────────────────────
  // Menu
  // ──────────────────────────────────────────────

  _openMenu(e, photoId) {
    e.stopPropagation()
    this._menuPhotoId = photoId
    // Position near click but keep within viewport
    const x = Math.min(e.clientX, window.innerWidth - 200)
    const y = Math.min(e.clientY, window.innerHeight - 300)
    this._menuX = x
    this._menuY = y
  }

  _closeMenu() {
    this._menuPhotoId = null
  }

  _assignTo(sectionId, subsectionId = null) {
    this.dispatchEvent(new CustomEvent('assign-photo', {
      detail: { photoId: this._menuPhotoId, sectionId, subsectionId },
      bubbles: true, composed: true,
    }))
    this._menuPhotoId = null
  }

  _unassign() {
    this.dispatchEvent(new CustomEvent('unassign-photo', {
      detail: { photoId: this._menuPhotoId },
      bubbles: true, composed: true,
    }))
    this._menuPhotoId = null
  }

  _removePhoto(photoId) {
    this.dispatchEvent(new CustomEvent('remove-photo', {
      detail: { photoId },
      bubbles: true, composed: true,
    }))
  }

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────

  _renderCard(photo) {
    const label = this._labelFor(photo)
    const isDropTarget = this._dragOverPhotoId === photo.id
    return html`
      <div
        class="card ${isDropTarget ? 'drop-target' : ''}"
        draggable="true"
        @dragstart=${e => this._onDragStart(e, photo.id)}
        @dragend=${() => this._onDragEnd()}
        @dragover=${e => this._onDragOverCard(e, photo.id)}
        @dragleave=${() => this._onDragLeaveCard()}
        @drop=${e => this._onDropOnCard(e, photo.id)}
      >
        <img src=${photo.url} alt=${photo.name} loading="lazy" />

        ${label ? html`<div class="assigned-badge">${label}</div>` : ''}

        <div class="card-overlay">
          <div class="card-name">${photo.name}</div>
          ${label ? html`<div class="card-path">${label}</div>` : ''}
        </div>

        <div class="card-btns">
          <button class="card-btn" title="Asignar a…" @click=${e => this._openMenu(e, photo.id)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </button>
          <button class="card-btn remove" title="Quitar foto" @click=${() => this._removePhoto(photo.id)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `
  }

  _renderMenu() {
    if (!this._menuPhotoId) return ''
    const photo = this.photos.find(p => p.id === this._menuPhotoId)
    if (!photo) return ''

    return html`
      <div class="assign-menu" style="left:${this._menuX}px;top:${this._menuY}px" @click=${e => e.stopPropagation()}>
        <div class="menu-section">${t('assignTo')}</div>

        ${this.sections.map(s => html`
          <div class="menu-item" @click=${() => this._assignTo(s.id, null)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            ${s.name}
          </div>
          ${s.subsections.map(ss => html`
            <div class="menu-item" style="padding-left:22px" @click=${() => this._assignTo(s.id, ss.id)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              ${ss.name}
            </div>
          `)}
        `)}

        ${this.sections.length === 0 ? html`
          <div class="menu-item" style="color:#4a5568;cursor:default">${t('noSections')}</div>
        ` : ''}

        ${photo.sectionId ? html`
          <div class="menu-divider"></div>
          <div class="menu-item unassign" @click=${this._unassign}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            ${t('removeAssignment')}
          </div>
        ` : ''}
      </div>
    `
  }

  render() {
    const visible = this._visiblePhotos
    const title = this._viewTitle()

    return html`
      <div class="view-header">
        <div class="view-title">${title}</div>
        <span class="badge">${visible.length}</span>
        <span class="view-subtitle">
          ${this.selectedNodeId === 'unassigned'
            ? t('dragHint')
            : t('reorderHint')}
        </span>
      </div>

      ${visible.length === 0 ? html`
        <div class="empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <p>${this.photos.length === 0 ? t('importHint') : t('noPhotosInSection')}</p>
        </div>
      ` : html`
        <div class="grid-scroll">
          <div class="grid">
            ${visible.map(p => this._renderCard(p))}
          </div>
        </div>
      `}

      ${this._renderMenu()}
    `
  }
}

customElements.define('pio-photo-grid', PioPhotoGrid)
