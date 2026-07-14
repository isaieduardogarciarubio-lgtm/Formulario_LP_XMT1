/**
 * Lógica central de la aplicación
 * Implementa la Guía de Diseño UX/UI: Minimalismo Oscuro y Flujos Asistidos v2.0
 */

class FormApp {
  constructor() {
    this.currentForm = null;
    this.currentFormEngine = null;
    this.rapidScanner = null;
    this.lastScan = null; // guardia anti-duplicados { code, ts }
    this.records = []; // Registros acumulados en la sesión
    this.init();
  }

  init() {
    this.showMenu();
  }

  /**
   * Header vacío (solo título, sin controles) — pantalla de selección
   */
  setHeader({ title, leftIcon, leftAction, rightIcon, rightAction } = {}) {
    const left = document.getElementById('navbar_left');
    const right = document.getElementById('navbar_right');

    left.innerHTML = leftIcon
      ? `<button class="icon-btn-plain" aria-label="Atrás" title="Atrás">${Icons.svg(leftIcon, { size: 22 })}</button>`
      : `<span class="navbar-title">${title || ''}</span>`;

    right.innerHTML = rightIcon
      ? `<button class="icon-btn-plain" aria-label="Cerrar" title="Cerrar">${Icons.svg(rightIcon, { size: 22 })}</button>`
      : '';

    if (leftIcon && leftAction) left.querySelector('button').addEventListener('click', leftAction);
    if (rightIcon && rightAction) right.querySelector('button').addEventListener('click', rightAction);
  }

  /**
   * Muestra el menú inicial con selector de formularios
   * (pantalla de una sola acción: elegir un formulario)
   */
  showMenu() {
    this.destroyCurrentFormEngine();
    this.setHeader({ title: 'Generador de CSV' });

    const app = document.getElementById('app');
    app.innerHTML = '';

    const content = document.createElement('div');
    content.className = 'content';
    content.innerHTML = `
      <div>
        <h1 class="step-question" style="margin-bottom: var(--spacing-xs);">¿Qué formulario deseas llenar?</h1>
        <p style="color: var(--color-text-muted); font-size: var(--font-body);">Selecciona un tipo de registro para comenzar</p>
      </div>
    `;

    const grid = document.createElement('div');
    grid.className = 'forms-grid';

    getAllForms().forEach((form) => {
      const card = document.createElement('div');
      card.className = 'form-card';
      card.innerHTML = `
        <div class="form-card-icon">${Icons.svg(form.icon, { size: 20 })}</div>
        <div class="form-card-body">
          <div class="form-card-title">${form.title}</div>
          <div class="form-card-desc">${form.description}</div>
        </div>
        <div class="form-card-arrow">${Icons.svg('arrowRight', { size: 18 })}</div>
      `;
      card.addEventListener('click', () => this.showFormPage(form.id));
      grid.appendChild(card);
    });

    content.appendChild(grid);
    app.appendChild(content);
  }

  /**
   * Inicia el flujo de captura de un formulario (una pregunta por pantalla)
   */
  showFormPage(formId) {
    const formConfig = getFormConfig(formId);
    if (!formConfig) {
      this.showAlert('Formulario no encontrado', 'error');
      return;
    }

    this.destroyCurrentFormEngine();

    // Al cambiar de tipo de formulario, reiniciamos los registros acumulados
    if (this.recordsFormId !== formId) {
      this.records = [];
      this.recordsFormId = formId;
    }
    this.currentForm = formConfig;

    // Modo escaneo rápido: pantalla dedicada de captura por cámara
    if (formConfig.mode === 'rapid') {
      this.showRapidScan();
      return;
    }

    const app = document.getElementById('app');
    app.innerHTML = '';

    const container = document.createElement('div');
    container.id = 'step_container';
    app.appendChild(container);

    this.currentFormEngine = new FormEngine(formConfig, {
      onComplete: (data) => this.handleRecordComplete(data),
      onCancel: () => this.showMenu(),
    });

    this.setHeader({
      leftIcon: 'arrowLeft',
      leftAction: () => this.currentFormEngine.back(),
      rightIcon: 'close',
      rightAction: () => this.showMenu(),
    });

    this.currentFormEngine.render('step_container');
  }

  /**
   * Libera recursos del paso de captura anterior (viewport y cámara)
   */
  destroyCurrentFormEngine() {
    if (this.currentFormEngine) {
      this.currentFormEngine.destroy();
      this.currentFormEngine = null;
    }
    this.stopRapidScanner();
  }

  stopRapidScanner() {
    if (this.rapidScanner) {
      this.rapidScanner.stop();
      this.rapidScanner = null;
    }
  }

  /* ======================================================================
     Modo escaneo rápido — cada código detectado = un registro (modo A)
     ====================================================================== */

  async showRapidScan() {
    this.setHeader({
      leftIcon: 'arrowLeft',
      leftAction: () => this.showMenu(),
      rightIcon: 'close',
      rightAction: () => this.showMenu(),
    });

    const app = document.getElementById('app');
    app.innerHTML = '';

    const content = document.createElement('div');
    content.className = 'content rapid-scan';
    content.innerHTML = `
      <div class="scanner-body">
        <div class="scanner-viewport">
          <video class="scanner-video" playsinline muted></video>
          <div class="scanner-frame"><span class="scanner-line"></span></div>
        </div>
      </div>
      <div class="rapid-status">
        <span class="rapid-count" id="rapid_count">0 escaneados</span>
      </div>
      <div class="step-support" id="rapid_support">Apunta al código. Cada lectura se guarda como un registro.</div>
    `;
    app.appendChild(content);

    this.rapidCountEl = document.getElementById('rapid_count');
    this.rapidSupportEl = document.getElementById('rapid_support');
    this.updateRapidCount();

    // Zona de acciones flotante
    const actions = document.createElement('div');
    actions.className = 'step-actions rapid-actions';

    const manualBtn = document.createElement('button');
    manualBtn.type = 'button';
    manualBtn.className = 'btn btn-secondary';
    manualBtn.innerHTML = `${Icons.svg('keyboard', { size: 16 })}<span>Manual</span>`;
    manualBtn.addEventListener('click', () => this.rapidManualEntry());

    const doneBtn = document.createElement('button');
    doneBtn.type = 'button';
    doneBtn.className = 'btn btn-primary';
    doneBtn.innerHTML = `<span>Ver registros</span>${Icons.svg('arrowRight', { size: 16 })}`;
    doneBtn.addEventListener('click', () => this.showRecordsPage());

    actions.appendChild(manualBtn);
    actions.appendChild(doneBtn);
    app.appendChild(actions);
    this.rapidActionsEl = actions;

    if (!ScannerEngine.isSupported()) {
      this.setRapidSupport('Tu navegador no permite usar la cámara. Usa "Manual".', true);
      return;
    }

    const video = content.querySelector('.scanner-video');
    this.rapidScanner = new ScannerEngine();
    try {
      await this.rapidScanner.start(video, (text, format) => this.onRapidDetected(text, format));
      this.maybeAddRapidTorch();
    } catch (err) {
      const msg =
        err && err.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Usa "Manual".'
          : 'No se pudo abrir la cámara. Usa "Manual".';
      this.setRapidSupport(msg, true);
    }
  }

  maybeAddRapidTorch() {
    if (!this.rapidScanner || !this.rapidScanner.hasTorch()) return;
    const viewport = document.querySelector('.rapid-scan .scanner-viewport');
    if (!viewport) return;
    const torchBtn = document.createElement('button');
    torchBtn.type = 'button';
    torchBtn.className = 'scanner-torch';
    torchBtn.setAttribute('aria-label', 'Linterna');
    torchBtn.innerHTML = Icons.svg('flash', { size: 20 });
    let on = false;
    torchBtn.addEventListener('click', async () => {
      on = !on;
      const ok = await this.rapidScanner.setTorch(on);
      torchBtn.classList.toggle('active', ok && on);
    });
    viewport.appendChild(torchBtn);
  }

  onRapidDetected(text, format) {
    if (!text) return;

    // Guardia anti-duplicados: mismo código en menos de 2.5s se ignora
    const now = Date.now();
    if (this.lastScan && this.lastScan.code === text && now - this.lastScan.ts < 2500) {
      return;
    }

    if (this.rapidScanner) this.rapidScanner.pause();
    if (navigator.vibrate) navigator.vibrate(60);

    this.showRapidConfirm(text, format);
  }

  /**
   * Overlay de confirmación por tap antes de guardar (decisión de UX)
   */
  showRapidConfirm(text, format) {
    const existing = document.querySelector('.rapid-confirm');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'rapid-confirm';
    overlay.innerHTML = `
      <div class="rapid-confirm-card">
        <div class="scanner-result-badge">${Icons.svg('checkCircle', { size: 22 })}</div>
        <div class="scanner-result-label">Código detectado</div>
        <div class="scanner-result-value"></div>
        ${format ? `<div class="scanner-result-format">${this.formatLabel(format)}</div>` : ''}
        <div class="rapid-confirm-actions"></div>
      </div>
    `;
    overlay.querySelector('.scanner-result-value').textContent = text;

    const actionsRow = overlay.querySelector('.rapid-confirm-actions');

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'btn btn-secondary';
    retryBtn.innerHTML = `${Icons.svg('refresh', { size: 16 })}<span>Descartar</span>`;
    retryBtn.addEventListener('click', () => {
      overlay.remove();
      if (this.rapidScanner) this.rapidScanner.resume();
    });

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn btn-primary';
    saveBtn.innerHTML = `${Icons.svg('check', { size: 16 })}<span>Guardar</span>`;
    saveBtn.addEventListener('click', () => {
      this.saveRapidRecord(text, format);
      overlay.remove();
      if (this.rapidScanner) this.rapidScanner.resume();
    });

    actionsRow.appendChild(retryBtn);
    actionsRow.appendChild(saveBtn);
    document.getElementById('app').appendChild(overlay);
  }

  saveRapidRecord(text, format) {
    this.lastScan = { code: text, ts: Date.now() };
    const record = {
      code: text,
      format: this.formatLabel(format),
      scanned_at: new Date().toLocaleString('es-MX'),
    };
    this.records.push(record);
    this.updateRapidCount();
    this.setRapidSupport(`Guardado: ${text}`, false);
  }

  rapidManualEntry() {
    const code = prompt('Escribe el código manualmente:');
    if (code && code.trim()) {
      this.saveRapidRecord(code.trim(), null);
    }
  }

  updateRapidCount() {
    if (this.rapidCountEl) {
      this.rapidCountEl.textContent = `${this.records.length} escaneado${this.records.length === 1 ? '' : 's'}`;
    }
  }

  setRapidSupport(message, isError) {
    if (!this.rapidSupportEl) return;
    this.rapidSupportEl.textContent = message;
    this.rapidSupportEl.classList.toggle('error', !!isError);
  }

  formatLabel(format) {
    if (!format) return 'Manual';
    const labels = {
      qr_code: 'QR',
      ean_13: 'EAN-13',
      ean_8: 'EAN-8',
      upc_a: 'UPC-A',
      upc_e: 'UPC-E',
      code_128: 'Code 128',
      code_39: 'Code 39',
      code_93: 'Code 93',
      codabar: 'Codabar',
      itf: 'ITF',
      data_matrix: 'Data Matrix',
      pdf417: 'PDF417',
      aztec: 'Aztec',
    };
    return labels[format] || format;
  }

  /**
   * Se ejecuta al completar todas las preguntas de un formulario
   */
  handleRecordComplete(data) {
    this.records.push(data);
    this.showAlert(`Registro agregado (total: ${this.records.length})`, 'success');
    this.showRecordsPage();
  }

  /**
   * Pantalla de resumen: registros acumulados + acciones (exportar / agregar otro)
   */
  showRecordsPage() {
    this.destroyCurrentFormEngine();
    this.setHeader({
      leftIcon: 'arrowLeft',
      leftAction: () => this.showMenu(),
    });

    const app = document.getElementById('app');
    app.innerHTML = '';

    const content = document.createElement('div');
    content.className = 'content';

    const title = document.createElement('h1');
    title.className = 'step-question';
    title.style.marginBottom = 'var(--spacing-lg)';
    title.textContent = this.currentForm.title;
    content.appendChild(title);

    if (this.records.length > 0) {
      const recordsSection = document.createElement('div');
      recordsSection.className = 'card';

      const recordsTitle = document.createElement('h3');
      recordsTitle.style.marginBottom = 'var(--spacing-md)';
      recordsTitle.innerHTML = `<span>Registros Acumulados</span> <span class="form-card-meta" style="margin-left:auto">${this.records.length}</span>`;
      recordsTitle.style.display = 'flex';
      recordsTitle.style.alignItems = 'center';
      recordsSection.appendChild(recordsTitle);

      const tableWrap = document.createElement('div');
      tableWrap.className = 'records-table-wrap';
      tableWrap.appendChild(this.renderRecordsTable());
      recordsSection.appendChild(tableWrap);

      content.appendChild(recordsSection);

      const actionButtonGroup = document.createElement('div');
      actionButtonGroup.className = 'flex-row';
      actionButtonGroup.style.marginTop = 'var(--spacing-lg)';
      actionButtonGroup.style.marginBottom = '100px';

      const addBtn = document.createElement('button');
      addBtn.className = 'btn btn-primary btn-block';
      addBtn.innerHTML = `${Icons.svg('plus', { size: 18 })}<span>Agregar Otro Registro</span>`;
      addBtn.addEventListener('click', () => this.showFormPage(this.currentForm.id));

      const exportBtn = document.createElement('button');
      exportBtn.className = 'btn btn-secondary btn-block';
      exportBtn.innerHTML = `<span>Descargar CSV</span>`;
      exportBtn.addEventListener('click', () => this.exportToCSV());

      const clearBtn = document.createElement('button');
      clearBtn.className = 'btn btn-secondary btn-block';
      clearBtn.innerHTML = `<span>Limpiar Todo</span>`;
      clearBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro? Se perderán todos los registros.')) {
          this.records = [];
          this.showRecordsPage();
        }
      });

      actionButtonGroup.appendChild(addBtn);
      actionButtonGroup.appendChild(exportBtn);
      actionButtonGroup.appendChild(clearBtn);
      content.appendChild(actionButtonGroup);
    } else {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <div class="empty-state-icon">${Icons.svg('inbox', { size: 28 })}</div>
        <p>Aún no hay registros.</p>
      `;
      content.appendChild(emptyState);

      const addBtn = document.createElement('button');
      addBtn.className = 'btn btn-primary btn-block';
      addBtn.style.marginTop = 'var(--spacing-lg)';
      addBtn.innerHTML = `<span>Comenzar</span>${Icons.svg('arrowRight', { size: 18 })}`;
      addBtn.addEventListener('click', () => this.showFormPage(this.currentForm.id));
      content.appendChild(addBtn);
    }

    app.appendChild(content);
  }

  /**
   * Elimina un registro por índice
   */
  deleteRecord(index) {
    if (confirm('¿Eliminar este registro?')) {
      this.records.splice(index, 1);
      this.showAlert('Registro eliminado', 'success');
      this.showRecordsPage();
    }
  }

  /**
   * Renderiza tabla de registros
   */
  renderRecordsTable() {
    const table = document.createElement('table');
    table.className = 'records-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    this.currentForm.csvColumns.forEach((col) => {
      const th = document.createElement('th');
      th.textContent = col.header;
      headerRow.appendChild(th);
    });

    const thAction = document.createElement('th');
    thAction.textContent = 'Acciones';
    thAction.style.width = '80px';
    headerRow.appendChild(thAction);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    this.records.forEach((record, index) => {
      const row = document.createElement('tr');

      this.currentForm.csvColumns.forEach((col) => {
        const td = document.createElement('td');
        const value = record[col.field] || '';
        td.textContent = value.length > 50 ? value.substring(0, 50) + '...' : value;
        td.title = value;
        row.appendChild(td);
      });

      const tdAction = document.createElement('td');
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-secondary btn-sm';
      deleteBtn.textContent = 'Borrar';
      deleteBtn.addEventListener('click', () => this.deleteRecord(index));
      tdAction.appendChild(deleteBtn);
      row.appendChild(tdAction);

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    return table;
  }

  /**
   * Exporta registros a CSV
   */
  exportToCSV() {
    const result = CSVEngine.exportAndDownload(this.records, this.currentForm);
    if (result.success) {
      this.showAlert('CSV descargado exitosamente', 'success');
    } else {
      this.showAlert(`Error: ${result.error}`, 'error');
    }
  }

  /**
   * Muestra una alerta temporal con icono
   */
  showAlert(message, type = 'info') {
    const iconByType = {
      success: 'checkCircle',
      error: 'alertCircle',
      info: 'infoCircle',
    };

    const hasFloatingActions = !!document.querySelector('.step-actions');

    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type}`;
    alertEl.style.position = 'fixed';
    alertEl.style.bottom = hasFloatingActions
      ? 'calc(96px + env(safe-area-inset-bottom))'
      : 'calc(var(--spacing-lg) + env(safe-area-inset-bottom))';
    alertEl.style.left = 'var(--spacing-md)';
    alertEl.style.right = 'var(--spacing-md)';
    alertEl.style.maxWidth = '380px';
    alertEl.style.marginLeft = 'auto';
    alertEl.style.marginRight = 'auto';
    alertEl.style.zIndex = '9999';
    alertEl.innerHTML = `
      <span class="alert-icon">${Icons.svg(iconByType[type] || 'infoCircle', { size: 16 })}</span>
      <span>${message}</span>
    `;

    document.body.appendChild(alertEl);

    setTimeout(() => {
      alertEl.remove();
    }, 3000);
  }
}

// Instancia global
let app;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  app = new FormApp();
});
