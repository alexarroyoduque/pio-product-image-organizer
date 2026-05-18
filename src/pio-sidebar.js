import { LitElement, html, css } from 'lit'
import { I18nMixin, t } from './i18n.js'

export class PioSidebar extends I18nMixin(LitElement) {
  static properties = {
    sections: { type: Array },
    photos: { type: Array },
    templates: { type: Array },
    selectedNodeId: { type: String },
    _dragOverId: { type: String },
    _editingId: { type: String },
    _editingValue: { type: String },
    _addingSectionName: { type: String },
    _addingSubOf: { type: String },
    _addingSubName: { type: String },
    _templatesOpen: { type: Boolean },
    _savingTemplate: { type: Boolean },
    _saveTemplateName: { type: String },
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 260px;
      min-width: 200px;
      background: #161b27;
      border-right: 1px solid #1e2535;
      overflow-y: auto;
      flex-shrink: 0;
    }

    .sidebar-header {
      padding: 16px 16px 8px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1.2px;
      color: #4a5568;
      text-transform: uppercase;
    }

    ul { list-style: none; padding: 0; margin: 0; }

    /* ── Node base ── */
    .node {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px 7px 12px;
      border-radius: 6px;
      margin: 1px 8px;
      cursor: pointer;
      font-size: 15px;
      color: #94a3b8;
      user-select: none;
      transition: background 0.12s;
      min-height: 38px;
    }
    .node:hover { background: #1e2535; color: #e2e8f0; }
    .node.selected { background: #1e3a5f; color: #7eb3ff; }
    .node.drag-over { background: #1a3a2a; color: #4ade80; outline: 2px dashed #4ade80; }

    .node-icon { flex-shrink: 0; opacity: 0.6; }
    .node-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .node-count {
      font-size: 13px;
      background: #2d3748;
      color: #64748b;
      border-radius: 10px;
      padding: 1px 8px;
      flex-shrink: 0;
    }
    .node.selected .node-count { background: #1d4e89; color: #90bfff; }

    /* ── Section ── */
    .section-node { font-weight: 500; }

    /* ── Subsection ── */
    .subsection-list { padding-left: 20px; }
    .sub-node { font-size: 14px; padding-left: 10px; }

    /* ── Node actions (hover) ── */
    .node-actions {
      display: none;
      gap: 2px;
      flex-shrink: 0;
    }
    .node:hover .node-actions { display: flex; }

    .icon-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: #64748b;
      padding: 3px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      transition: color 0.12s, background 0.12s;
    }
    .icon-btn:hover { color: #e2e8f0; background: #2d3748; }
    .icon-btn.danger:hover { color: #f87171; }

    /* ── Inline edit ── */
    .node-edit {
      flex: 1;
      background: #0f1117;
      border: 1px solid #4f8ef7;
      border-radius: 4px;
      color: #e2e8f0;
      font-size: 13px;
      padding: 2px 6px;
      outline: none;
    }

    /* ── Add forms ── */
    .add-form {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px 6px 12px;
      margin: 1px 8px;
    }
    .add-input {
      flex: 1;
      background: #0f1117;
      border: 1px solid #2d3748;
      border-radius: 6px;
      color: #e2e8f0;
      font-size: 14px;
      padding: 6px 10px;
      outline: none;
      transition: border-color 0.15s;
    }
    .add-input:focus { border-color: #4f8ef7; }
    .add-input::placeholder { color: #4a5568; }

    .confirm-btn {
      background: #4f8ef7;
      border: none;
      color: #fff;
      border-radius: 5px;
      padding: 5px 10px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    .cancel-btn {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }
    .cancel-btn:hover { color: #f87171; }

    .add-trigger {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px 7px 12px;
      margin: 1px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #4a5568;
      transition: color 0.12s;
    }
    .add-trigger:hover { color: #94a3b8; }

    .divider {
      height: 1px;
      background: #1e2535;
      margin: 8px 12px;
    }

    /* ── Templates panel ── */
    .tpl-toggle {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 10px 12px 10px 16px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
      color: #4a5568;
      text-transform: uppercase;
      transition: color 0.12s;
      user-select: none;
    }
    .tpl-toggle:hover { color: #94a3b8; }
    .tpl-toggle svg { flex-shrink: 0; transition: transform 0.2s; }
    .tpl-toggle.open svg.chevron { transform: rotate(180deg); }
    .tpl-toggle .spacer { flex: 1; }

    .tpl-body {
      padding-bottom: 8px;
    }
    .tpl-empty {
      padding: 6px 20px 8px;
      font-size: 13px;
      color: #4a5568;
      font-style: italic;
    }
    .tpl-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px 6px 16px;
      margin: 1px 8px;
      border-radius: 6px;
    }
    .tpl-item:hover { background: #1e2535; }
    .tpl-name {
      flex: 1;
      font-size: 14px;
      color: #cbd5e1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tpl-meta {
      font-size: 11px;
      color: #4a5568;
      white-space: nowrap;
    }
    .tpl-apply {
      background: #1e3a5f;
      border: none;
      color: #7eb3ff;
      border-radius: 5px;
      padding: 4px 9px;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.12s;
    }
    .tpl-apply:hover { background: #1d4e89; }
    .tpl-delete {
      background: transparent;
      border: none;
      color: #4a5568;
      cursor: pointer;
      padding: 3px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: color 0.12s;
    }
    .tpl-delete:hover { color: #f87171; }
  `

  constructor() {
    super()
    this.sections = []
    this.photos = []
    this.templates = []
    this.selectedNodeId = 'unassigned'
    this._dragOverId = null
    this._editingId = null
    this._editingValue = ''
    this._addingSectionName = ''
    this._addingSubOf = null
    this._addingSubName = ''
    this._templatesOpen = false
    this._savingTemplate = false
    this._saveTemplateName = ''
  }

  // ──────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────

  _countFor(sectionId, subsectionId = null) {
    return this.photos.filter(p =>
      p.sectionId === sectionId && p.subsectionId === subsectionId
    ).length
  }

  _countSection(sectionId) {
    return this.photos.filter(p => p.sectionId === sectionId).length
  }

  _countUnassigned() {
    return this.photos.filter(p => !p.sectionId).length
  }

  // ──────────────────────────────────────────────
  // Drag handlers
  // ──────────────────────────────────────────────

  _onDragOver(e, nodeId) {
    e.preventDefault()
    this._dragOverId = nodeId
  }

  _onDragLeave() {
    this._dragOverId = null
  }

  _onDrop(e, nodeId) {
    e.preventDefault()
    this._dragOverId = null
    this.dispatchEvent(new CustomEvent('drop-on-node', { detail: { nodeId }, bubbles: true, composed: true }))
  }

  // ──────────────────────────────────────────────
  // Select
  // ──────────────────────────────────────────────

  _select(id) {
    this.dispatchEvent(new CustomEvent('select-node', { detail: { id }, bubbles: true, composed: true }))
  }

  // ──────────────────────────────────────────────
  // Inline edit
  // ──────────────────────────────────────────────

  _startEdit(e, id, currentName) {
    e.stopPropagation()
    this._editingId = id
    this._editingValue = currentName
    this.updateComplete.then(() => {
      const input = this.shadowRoot.querySelector('.node-edit')
      if (input) { input.focus(); input.select() }
    })
  }

  _onEditKeydown(e, id) {
    if (e.key === 'Enter') this._confirmEdit(id)
    if (e.key === 'Escape') this._editingId = null
  }

  _confirmEdit(id) {
    const name = this._editingValue.trim()
    if (name) {
      this.dispatchEvent(new CustomEvent('rename-node', { detail: { id, name }, bubbles: true, composed: true }))
    }
    this._editingId = null
  }

  // ──────────────────────────────────────────────
  // Delete
  // ──────────────────────────────────────────────

  _deleteNode(e, id) {
    e.stopPropagation()
    this.dispatchEvent(new CustomEvent('delete-node', { detail: { id }, bubbles: true, composed: true }))
  }

  // ──────────────────────────────────────────────
  // Add section
  // ──────────────────────────────────────────────

  _onAddSectionKeydown(e) {
    if (e.key === 'Enter') this._confirmAddSection()
    if (e.key === 'Escape') this._addingSectionName = ''
  }

  _confirmAddSection() {
    const name = this._addingSectionName.trim()
    if (!name) return
    this.dispatchEvent(new CustomEvent('add-section', { detail: { name }, bubbles: true, composed: true }))
    this._addingSectionName = ''
  }

  // ──────────────────────────────────────────────
  // Add subsection
  // ──────────────────────────────────────────────

  _startAddSub(e, sectionId) {
    e.stopPropagation()
    this._addingSubOf = sectionId
    this._addingSubName = ''
    this.updateComplete.then(() => {
      const input = this.shadowRoot.querySelector('.sub-add-input')
      if (input) input.focus()
    })
  }

  _onAddSubKeydown(e) {
    if (e.key === 'Enter') this._confirmAddSub()
    if (e.key === 'Escape') this._addingSubOf = null
  }

  _confirmAddSub() {
    const name = this._addingSubName.trim()
    if (!name) return
    this.dispatchEvent(new CustomEvent('add-subsection', { detail: { sectionId: this._addingSubOf, name }, bubbles: true, composed: true }))
    this._addingSubOf = null
  }

  // ──────────────────────────────────────────────
  // Render helpers
  // ──────────────────────────────────────────────

  _renderNodeName(id, name) {
    if (this._editingId === id) {
      return html`
        <input
          class="node-edit"
          .value=${this._editingValue}
          @input=${e => { this._editingValue = e.target.value }}
          @keydown=${e => this._onEditKeydown(e, id)}
          @blur=${() => this._confirmEdit(id)}
          @click=${e => e.stopPropagation()}
        />`
    }
    return html`<span class="node-name">${name}</span>`
  }

  _renderSection(section) {
    const isSelected = this.selectedNodeId === section.id
    const isDragOver = this._dragOverId === section.id
    const count = this._countSection(section.id)
    return html`
      <li>
        <div
          class="node section-node ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''}"
          @click=${() => this._select(section.id)}
          @dragover=${e => this._onDragOver(e, section.id)}
          @dragleave=${() => this._onDragLeave()}
          @drop=${e => this._onDrop(e, section.id)}
        >
          <!-- folder icon -->
          <svg class="node-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          ${this._renderNodeName(section.id, section.name)}
          ${count > 0 ? html`<span class="node-count">${count}</span>` : ''}
          <div class="node-actions">
            <button class="icon-btn" .title=${t('rename')} @click=${e => this._startEdit(e, section.id, section.name)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="icon-btn" .title=${t('addSubsection')} @click=${e => this._startAddSub(e, section.id)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button class="icon-btn danger" .title=${t('deleteSection')} @click=${e => this._deleteNode(e, section.id)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>
          </div>
        </div>

        <!-- Subsections -->
        ${section.subsections.length > 0 || this._addingSubOf === section.id ? html`
          <ul class="subsection-list">
            ${section.subsections.map(sub => this._renderSubsection(sub))}
            ${this._addingSubOf === section.id ? html`
              <li>
                <div class="add-form">
                  <input
                    class="add-input sub-add-input"
                    .placeholder=${t('newSubsectionPlaceholder')}
                    .value=${this._addingSubName}
                    @input=${e => { this._addingSubName = e.target.value }}
                    @keydown=${this._onAddSubKeydown}
                  />
                  <button class="confirm-btn" @click=${this._confirmAddSub}>✓</button>
                  <button class="cancel-btn" @click=${() => { this._addingSubOf = null }}>✕</button>
                </div>
              </li>
            ` : ''}
          </ul>
        ` : ''}
      </li>
    `
  }

  _renderSubsection(sub) {
    const isSelected = this.selectedNodeId === sub.id
    const isDragOver = this._dragOverId === sub.id
    const count = this._countFor(this._parentSectionId(sub.id), sub.id)
    return html`
      <li>
        <div
          class="node sub-node ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''}"
          @click=${() => this._select(sub.id)}
          @dragover=${e => this._onDragOver(e, sub.id)}
          @dragleave=${() => this._onDragLeave()}
          @drop=${e => this._onDrop(e, sub.id)}
        >
          <svg class="node-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          ${this._renderNodeName(sub.id, sub.name)}
          ${count > 0 ? html`<span class="node-count">${count}</span>` : ''}
          <div class="node-actions">
            <button class="icon-btn" .title=${t('rename')} @click=${e => this._startEdit(e, sub.id, sub.name)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="icon-btn danger" .title=${t('delete')} @click=${e => this._deleteNode(e, sub.id)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>
          </div>
        </div>
      </li>
    `
  }

  _parentSectionId(subsectionId) {
    for (const s of this.sections) {
      if (s.subsections.some(ss => ss.id === subsectionId)) return s.id
    }
    return null
  }

  // ──────────────────────────────────────────────
  // Templates
  // ──────────────────────────────────────────────

  _onSaveTemplateKeydown(e) {
    if (e.key === 'Enter') this._confirmSaveTemplate()
    if (e.key === 'Escape') { this._savingTemplate = false; this._saveTemplateName = '' }
  }

  _confirmSaveTemplate() {
    const name = this._saveTemplateName.trim()
    if (!name) return
    this.dispatchEvent(new CustomEvent('save-template', { detail: { name }, bubbles: true, composed: true }))
    this._savingTemplate = false
    this._saveTemplateName = ''
  }

  _applyTemplate(templateId) {
    this.dispatchEvent(new CustomEvent('apply-template', { detail: { templateId }, bubbles: true, composed: true }))
  }

  _deleteTemplate(templateId) {
    this.dispatchEvent(new CustomEvent('delete-template', { detail: { templateId }, bubbles: true, composed: true }))
  }

  render() {
    const unassigned = this._countUnassigned()
    const isUnassignedSelected = this.selectedNodeId === 'unassigned'
    const isUnassignedDragOver = this._dragOverId === 'unassigned'

    return html`
      <div class="sidebar-header">${t('sections')}</div>

      <ul>
        <!-- Unassigned node -->
        <li>
          <div
            class="node ${isUnassignedSelected ? 'selected' : ''} ${isUnassignedDragOver ? 'drag-over' : ''}"
            @click=${() => this._select('unassigned')}
            @dragover=${e => this._onDragOver(e, 'unassigned')}
            @dragleave=${() => this._onDragLeave()}
            @drop=${e => this._onDrop(e, 'unassigned')}
          >
            <svg class="node-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <span class="node-name">${t('unassigned')}</span>
            ${unassigned > 0 ? html`<span class="node-count">${unassigned}</span>` : ''}
          </div>
        </li>
      </ul>

      <div class="divider"></div>

      <ul>
        ${this.sections.map(s => this._renderSection(s))}
      </ul>

      <!-- Add section -->
      ${this._addingSectionName !== null ? html`
        <div class="add-form">
          <input
            class="add-input"
            .placeholder=${t('newSectionPlaceholder')}
            .value=${this._addingSectionName}
            @input=${e => { this._addingSectionName = e.target.value }}
            @keydown=${this._onAddSectionKeydown}
            @focus=${() => {}}
          />
          <button class="confirm-btn" @click=${this._confirmAddSection}>✓</button>
        </div>
      ` : ''}

      <div
        class="add-trigger"
        @click=${() => {
          this._addingSectionName = ''
          this.updateComplete.then(() => {
            const input = this.shadowRoot.querySelector('.add-input')
            if (input) input.focus()
          })
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        ${t('newSection')}
      </div>

      <div class="divider"></div>

      <!-- Templates panel -->
      <div
        class="tpl-toggle ${this._templatesOpen ? 'open' : ''}"
        @click=${() => { this._templatesOpen = !this._templatesOpen }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span>${t('templates')}</span>
        ${this.templates.length > 0 ? html`<span class="node-count">${this.templates.length}</span>` : ''}
        <span class="spacer"></span>
        <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      ${this._templatesOpen ? html`
        <div class="tpl-body">
          ${this.templates.length === 0 ? html`
            <div class="tpl-empty">${t('noTemplates')}</div>
          ` : this.templates.map(tpl => html`
            <div class="tpl-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:0.5">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span class="tpl-name">${tpl.name}</span>
              <span class="tpl-meta">${tpl.sections.length}×</span>
              <button class="tpl-apply" .title=${t('applyTemplate')} @click=${() => this._applyTemplate(tpl.id)}>
                ${t('applyTemplate')}
              </button>
              <button class="tpl-delete" .title=${t('deleteTemplate')} @click=${() => this._deleteTemplate(tpl.id)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </button>
            </div>
          `)}

          ${this._savingTemplate ? html`
            <div class="add-form">
              <input
                class="add-input"
                .placeholder=${t('templateNamePlaceholder')}
                .value=${this._saveTemplateName}
                @input=${e => { this._saveTemplateName = e.target.value }}
                @keydown=${this._onSaveTemplateKeydown}
              />
              <button class="confirm-btn" @click=${this._confirmSaveTemplate}>✓</button>
              <button class="cancel-btn" @click=${() => { this._savingTemplate = false; this._saveTemplateName = '' }}>✕</button>
            </div>
          ` : html`
            <div
              class="add-trigger"
              style="${this.sections.length === 0 ? 'opacity:0.35;pointer-events:none' : ''}"
              @click=${() => {
                this._savingTemplate = true
                this.updateComplete.then(() => {
                  const input = this.shadowRoot.querySelector('.add-form .add-input')
                  if (input) input.focus()
                })
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              ${t('saveAsTemplate')}
            </div>
          `}
        </div>
      ` : ''}
    `
  }
}

customElements.define('pio-sidebar', PioSidebar)
