/**
 * Motor de flujo de captura — una pregunta por pantalla (Single-Task Focus)
 * Basado en la Guía de Diseño UX/UI: Minimalismo Oscuro (Sección 1.1)
 * Soporta campos de texto/select/textarea, 'scanner' (QR/barras),
 * 'destino_combo' y 'doca_combo' (input + lista desplegable, permiten
 * escribir libremente o elegir), usados por el log Auditoría - Destino / Doca.
 */

class FormEngine {
  constructor(formConfig, { onComplete, onCancel, initialValues, autoAdvanceFields, catalogIndex } = {}) {
    this.formConfig = formConfig;
    this.onComplete = onComplete;
    this.onCancel = onCancel;
    this.initialValues = initialValues || {};
    this.autoAdvanceFields = autoAdvanceFields || [];
    this.catalogIndex = catalogIndex || {};
    this.stepIndex = 0;
    this.values = {};
    this.container = null;
    this.currentInput = null;
    this.actionsEl = null;
    this.errorTargetEl = null;
    this.scanner = null;
    this.handleViewportChange = this.repositionActions.bind(this);
  }

  get currentField() {
    return this.formConfig.fields[this.stepIndex];
  }

  get isLastStep() {
    return this.stepIndex === this.formConfig.fields.length - 1;
  }

  render(containerId) {
    this.container = document.getElementById(containerId);
    this.stepIndex = 0;
    this.values = { ...this.initialValues };
    // Campos precargados que se saltan una sola vez al avanzar hacia adelante
    this._autoAdvancePending = { ...this.initialValues };
    this.bindViewportTracking();
    this.renderStep();
  }

  /**
   * El teclado nativo no siempre reduce el layout viewport (position: fixed
   * queda anclado bajo el teclado). Usamos Visual Viewport API para
   * desplazar la barra de acciones y mantenerla siempre visible sobre él.
   */
  bindViewportTracking() {
    if (!window.visualViewport || this.viewportBound) return;
    this.viewportBound = true;
    window.visualViewport.addEventListener('resize', this.handleViewportChange);
    window.visualViewport.addEventListener('scroll', this.handleViewportChange);
  }

  repositionActions() {
    if (!this.actionsEl || !window.visualViewport) return;
    const vv = window.visualViewport;
    const keyboardInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    this.actionsEl.style.transform = keyboardInset > 0 ? `translateY(-${keyboardInset}px)` : '';
  }

  stopScanner() {
    if (this.scanner) {
      this.scanner.stop();
      this.scanner = null;
    }
  }

  destroy() {
    this.stopScanner();
    if (!window.visualViewport || !this.viewportBound) return;
    window.visualViewport.removeEventListener('resize', this.handleViewportChange);
    window.visualViewport.removeEventListener('scroll', this.handleViewportChange);
    this.viewportBound = false;
  }

  renderStep() {
    this.stopScanner();
    const field = this.currentField;

    // Si este campo ya viene precargado (ej. destino fijo entre capturas),
    // lo saltamos una sola vez y avanzamos directo al siguiente paso.
    if (this.autoAdvanceFields.includes(field.id) && this._autoAdvancePending[field.id] !== undefined) {
      delete this._autoAdvancePending[field.id];
      this.advance();
      return;
    }

    if (field.type === 'scanner') {
      this.renderScannerStep(field);
      return;
    }
    if (field.type === 'destino_combo') {
      this.renderDestinoStep(field);
      return;
    }
    if (field.type === 'doca_combo') {
      this.renderDocaStep(field);
      return;
    }

    this.container.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'step-screen';

    screen.appendChild(this.buildProgress());

    const h1 = document.createElement('h1');
    h1.className = 'step-question';
    h1.textContent = field.label;
    screen.appendChild(h1);

    const inputWrap = document.createElement('div');
    inputWrap.className = 'step-input-wrap';

    const input = this.buildInput(field);
    input.value = this.values[field.id] || '';
    inputWrap.appendChild(input);
    screen.appendChild(inputWrap);

    const support = document.createElement('div');
    support.className = 'step-support';
    screen.appendChild(support);

    this.container.appendChild(screen);

    this.currentInput = input;
    this.inputWrapEl = inputWrap;
    this.errorTargetEl = inputWrap;
    this.supportEl = support;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && field.type !== 'textarea') {
        e.preventDefault();
        this.next();
      }
    });

    input.addEventListener('input', () => this.clearError());

    this.renderActions(field);

    setTimeout(() => input.focus(), 60);
  }

  buildProgress() {
    const progress = document.createElement('div');
    progress.className = 'step-progress';
    progress.textContent = `${this.stepIndex + 1} / ${this.formConfig.fields.length}`;
    return progress;
  }

  buildInput(field) {
    let input;

    if (field.type === 'select') {
      input = document.createElement('select');
      input.className = 'step-input';
      field.options.forEach((option) => {
        const optEl = document.createElement('option');
        optEl.value = option.value;
        optEl.textContent = option.label;
        input.appendChild(optEl);
      });
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.className = 'step-input';
      input.placeholder = field.placeholder || '';
      input.rows = 3;
    } else {
      input = document.createElement('input');
      input.type = field.type;
      input.className = 'step-input';
      input.placeholder = field.placeholder || '';
      if (field.min !== undefined) input.min = field.min;
      if (field.max !== undefined) input.max = field.max;
    }

    input.id = field.id;
    input.name = field.id;
    return input;
  }

  renderActions(field) {
    const actions = document.createElement('div');
    actions.className = 'step-actions';

    if (!field.required) {
      const skipBtn = document.createElement('button');
      skipBtn.type = 'button';
      skipBtn.className = 'btn btn-secondary';
      skipBtn.textContent = 'Omitir';
      skipBtn.addEventListener('click', () => this.skip());
      actions.appendChild(skipBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn btn-primary';
    nextBtn.innerHTML = this.isLastStep
      ? `<span>Agregar Registro</span>${Icons.svg('check', { size: 16 })}`
      : `<span>Continuar</span>${Icons.svg('arrowRight', { size: 16 })}`;
    nextBtn.addEventListener('click', () => this.next());

    actions.appendChild(nextBtn);
    this.container.appendChild(actions);
    this.actionsEl = actions;
    this.repositionActions();
  }

  /**
   * Reemplaza la barra de acciones flotante con botones a medida.
   * @param {HTMLElement[]} children
   */
  setActions(children) {
    const existing = this.container.querySelector('.step-actions');
    if (existing) existing.remove();

    const actions = document.createElement('div');
    actions.className = 'step-actions';
    children.forEach((c) => c && actions.appendChild(c));
    this.container.appendChild(actions);
    this.actionsEl = actions;
    this.repositionActions();
  }

  makeButton(label, { primary, icon, iconAfter, onClick } = {}) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn ${primary ? 'btn-primary' : 'btn-secondary'}`;
    const iconSvg = icon ? Icons.svg(icon, { size: 16 }) : '';
    btn.innerHTML = iconAfter ? `<span>${label}</span>${iconSvg}` : `${iconSvg}<span>${label}</span>`;
    if (onClick) btn.addEventListener('click', onClick);
    return btn;
  }

  /* ======================================================================
     Campo escáner (QR / código de barras)
     ====================================================================== */

  renderScannerStep(field) {
    this.container.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'step-screen scanner-screen';

    screen.appendChild(this.buildProgress());

    const h1 = document.createElement('h1');
    h1.className = 'step-question';
    h1.textContent = field.label;
    screen.appendChild(h1);

    const body = document.createElement('div');
    body.className = 'scanner-body';
    screen.appendChild(body);

    const support = document.createElement('div');
    support.className = 'step-support';
    screen.appendChild(support);

    this.container.appendChild(screen);

    this.scannerBody = body;
    this.supportEl = support;

    this.enterScanningState(field);
  }

  async enterScanningState(field) {
    this.stopScanner();
    this.supportEl.textContent = 'Apunta la cámara al código QR o de barras.';
    this.supportEl.classList.remove('error');

    this.scannerBody.innerHTML = `
      <div class="scanner-viewport">
        <video class="scanner-video" playsinline muted></video>
        <div class="scanner-frame"><span class="scanner-line"></span></div>
      </div>
    `;

    const manualBtn = this.makeButton('Escribir manualmente', {
      icon: 'keyboard',
      onClick: () => this.enterManualState(field),
    });
    this.setActions([manualBtn]);

    if (!ScannerEngine.isSupported()) {
      this.enterManualState(field, 'Tu navegador no permite usar la cámara. Escribe el código manualmente.');
      return;
    }

    const video = this.scannerBody.querySelector('.scanner-video');
    this.scanner = new ScannerEngine();

    try {
      await this.scanner.start(video, (text, format) => {
        this.onScanDetected(field, text, format);
      });
      this.maybeAddTorchButton();
    } catch (err) {
      const msg =
        err && err.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Escribe el código manualmente.'
          : 'No se pudo abrir la cámara. Escribe el código manualmente.';
      this.enterManualState(field, msg);
    }
  }

  maybeAddTorchButton() {
    if (!this.scanner || !this.scanner.hasTorch()) return;
    const viewport = this.scannerBody.querySelector('.scanner-viewport');
    if (!viewport) return;
    const torchBtn = document.createElement('button');
    torchBtn.type = 'button';
    torchBtn.className = 'scanner-torch';
    torchBtn.setAttribute('aria-label', 'Linterna');
    torchBtn.innerHTML = Icons.svg('flash', { size: 20 });
    let on = false;
    torchBtn.addEventListener('click', async () => {
      on = !on;
      const ok = await this.scanner.setTorch(on);
      torchBtn.classList.toggle('active', ok && on);
    });
    viewport.appendChild(torchBtn);
  }

  onScanDetected(field, text, format) {
    if (this.scanner) this.scanner.pause();
    if (navigator.vibrate) navigator.vibrate(60);
    this.enterDetectedState(field, text, format);
  }

  enterDetectedState(field, text, format) {
    this.supportEl.textContent = '';
    this.supportEl.classList.remove('error');

    this.scannerBody.innerHTML = `
      <div class="scanner-result">
        <div class="scanner-result-badge">${Icons.svg('checkCircle', { size: 22 })}</div>
        <div class="scanner-result-label">Código detectado</div>
        <div class="scanner-result-value"></div>
        ${format ? `<div class="scanner-result-format">${this.formatLabel(format)}</div>` : ''}
      </div>
    `;
    this.scannerBody.querySelector('.scanner-result-value').textContent = text;

    const retryBtn = this.makeButton('Reintentar', {
      icon: 'refresh',
      onClick: () => this.enterScanningState(field),
    });
    const confirmBtn = this.makeButton(this.isLastStep ? 'Agregar Registro' : 'Confirmar', {
      primary: true,
      icon: this.isLastStep ? 'check' : 'arrowRight',
      iconAfter: true,
      onClick: () => {
        this.values[field.id] = text;
        this.stopScanner();
        this.advance();
      },
    });
    this.setActions([retryBtn, confirmBtn]);
  }

  enterManualState(field, note) {
    this.stopScanner();
    this.supportEl.textContent = note || '';
    this.supportEl.classList.toggle('error', !!note);

    this.scannerBody.innerHTML = '';
    const inputWrap = document.createElement('div');
    inputWrap.className = 'step-input-wrap';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'step-input';
    input.placeholder = field.placeholder || 'Escribe el código';
    input.value = this.values[field.id] || '';
    inputWrap.appendChild(input);
    this.scannerBody.appendChild(inputWrap);

    this.currentInput = input;
    this.inputWrapEl = inputWrap;

    input.addEventListener('input', () => this.clearError());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.confirmManual(field);
      }
    });

    const cameraBtn = this.makeButton('Usar cámara', {
      icon: 'scan',
      onClick: () => this.enterScanningState(field),
    });
    const nextBtn = this.makeButton(this.isLastStep ? 'Agregar Registro' : 'Continuar', {
      primary: true,
      icon: this.isLastStep ? 'check' : 'arrowRight',
      iconAfter: true,
      onClick: () => this.confirmManual(field),
    });
    this.setActions([cameraBtn, nextBtn]);

    setTimeout(() => input.focus(), 60);
  }

  confirmManual(field) {
    const value = this.currentInput.value.trim();
    if (field.required && !value) {
      this.showError('Este campo es obligatorio.');
      return;
    }
    this.values[field.id] = value;
    this.stopScanner();
    this.advance();
  }

  formatLabel(format) {
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

  /* ======================================================================
     Combo genérico: input de texto libre + lista desplegable de opciones.
     Usado por destino_combo y doca_combo.
     ====================================================================== */

  isNum(s) {
    return /^[0-9]+$/.test(String(s).trim());
  }

  getDestinoIndex() {
    return this.catalogIndex || {};
  }

  /**
   * Conecta un <input> con su lista desplegable de sugerencias.
   * @param {HTMLInputElement} input
   * @param {HTMLElement} listEl
   * @param {{getOptions:(q:string)=>string[], renderRow:(opt:string)=>string, onPick:(opt:string)=>void}} cfg
   */
  attachCombo(input, listEl, { getOptions, renderRow, onPick }) {
    const close = () => listEl.classList.remove('open');
    const renderList = () => {
      const options = getOptions(input.value.trim()).slice(0, 80);
      listEl.innerHTML = '';
      if (!options.length) {
        const empty = document.createElement('div');
        empty.className = 'combo-empty';
        empty.textContent = 'Sin coincidencias. Puedes escribir el valor directamente.';
        listEl.appendChild(empty);
        return;
      }
      options.forEach((opt) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'combo-opt';
        row.innerHTML = renderRow(opt);
        // evita que el blur del input cierre la lista antes del click
        row.addEventListener('mousedown', (e) => e.preventDefault());
        row.addEventListener('click', () => {
          onPick(opt);
          close();
        });
        listEl.appendChild(row);
      });
    };

    input.addEventListener('focus', () => {
      listEl.classList.add('open');
      renderList();
    });
    input.addEventListener('input', () => {
      listEl.classList.add('open');
      renderList();
    });
    input.addEventListener('blur', () => setTimeout(close, 150));
  }

  /* ======================================================================
     Campo destino_combo (escribir o elegir desde el catálogo)
     ====================================================================== */

  renderDestinoStep(field) {
    this.container.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'step-screen';

    screen.appendChild(this.buildProgress());

    const h1 = document.createElement('h1');
    h1.className = 'step-question';
    h1.textContent = field.label;
    screen.appendChild(h1);

    const inputWrap = document.createElement('div');
    inputWrap.className = 'step-input-wrap combo-wrap';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'step-input';
    input.placeholder = 'Escribe o elige un destino';
    input.value = this.values.destino || '';
    inputWrap.appendChild(input);

    const list = document.createElement('div');
    list.className = 'combo-list';
    inputWrap.appendChild(list);

    screen.appendChild(inputWrap);

    const support = document.createElement('div');
    support.className = 'step-support';
    screen.appendChild(support);

    this.container.appendChild(screen);

    this.currentInput = input;
    this.inputWrapEl = inputWrap;
    this.errorTargetEl = inputWrap;
    this.supportEl = support;

    const destinos = Object.keys(this.getDestinoIndex()).sort((a, b) => a.localeCompare(b, 'es'));

    this.attachCombo(input, list, {
      getOptions: (q) => {
        const query = q.toLowerCase();
        return query ? destinos.filter((d) => d.toLowerCase().includes(query)) : destinos;
      },
      renderRow: (destino) => {
        const docaCount = (this.getDestinoIndex()[destino] || []).length;
        return `<span class="combo-opt-label">${destino}</span><span class="combo-opt-meta">${docaCount} doca${docaCount === 1 ? '' : 's'}</span>`;
      },
      onPick: (destino) => {
        input.value = destino;
        this.clearError();
      },
    });

    input.addEventListener('input', () => this.clearError());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.next();
      }
    });

    this.renderActions(field);
    setTimeout(() => input.focus(), 60);
  }

  /* ======================================================================
     Campo doca_combo (escribir o elegir; dependiente del destino elegido)
     ====================================================================== */

  renderDocaStep(field) {
    this.container.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'step-screen';

    screen.appendChild(this.buildProgress());

    const h1 = document.createElement('h1');
    h1.className = 'step-question';
    h1.textContent = field.label;
    screen.appendChild(h1);

    const hint = document.createElement('div');
    hint.className = 'doca-hint';
    hint.innerHTML = 'Si la doca es numérica: <b class="ok">Sin incidencia</b>. Si no: <b class="bad">Erróneo</b>.';
    screen.appendChild(hint);

    const inputWrap = document.createElement('div');
    inputWrap.className = 'step-input-wrap combo-wrap';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'step-input';
    input.placeholder = 'Escribe o elige una doca';
    input.value = this.values.doca || '';
    inputWrap.appendChild(input);

    const list = document.createElement('div');
    list.className = 'combo-list';
    inputWrap.appendChild(list);

    screen.appendChild(inputWrap);

    const preview = document.createElement('div');
    preview.className = 'doca-preview';
    screen.appendChild(preview);

    const support = document.createElement('div');
    support.className = 'step-support';
    screen.appendChild(support);

    this.container.appendChild(screen);

    this.currentInput = input;
    this.inputWrapEl = inputWrap;
    this.errorTargetEl = inputWrap;
    this.supportEl = support;

    const docas = (this.getDestinoIndex()[this.values.destino] || []).slice().sort((a, b) => {
      const an = this.isNum(a);
      const bn = this.isNum(b);
      if (an && bn) return Number(a) - Number(b);
      if (an && !bn) return -1;
      if (!an && bn) return 1;
      return a.localeCompare(b, 'es');
    });

    const updatePreview = () => {
      const value = input.value.trim();
      if (!value) {
        preview.className = 'doca-preview';
        preview.textContent = '';
        return;
      }
      const ok = this.isNum(value);
      preview.className = 'doca-preview ' + (ok ? 'ok' : 'bad');
      preview.textContent = `Doca ${value} — ${ok ? 'Sin incidencia' : 'Erróneo'}`;
    };

    this.attachCombo(input, list, {
      getOptions: (q) => {
        const query = q.toLowerCase();
        return query ? docas.filter((d) => d.toLowerCase().includes(query)) : docas;
      },
      renderRow: (doca) => `<span class="combo-opt-label">${doca}</span>`,
      onPick: (doca) => {
        input.value = doca;
        this.clearError();
        updatePreview();
      },
    });

    input.addEventListener('input', () => {
      this.clearError();
      updatePreview();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.next();
      }
    });
    updatePreview();

    this.renderActions(field);
    setTimeout(() => input.focus(), 60);
  }

  /* ====================================================================== */

  readCurrentValue() {
    return this.currentInput ? this.currentInput.value.trim() : '';
  }

  showError(message) {
    if (!this.errorTargetEl) return;
    this.errorTargetEl.classList.add('error');
    this.supportEl.textContent = message;
    this.supportEl.classList.add('error');

    this.errorTargetEl.classList.remove('shake');
    void this.errorTargetEl.offsetWidth; // reinicia la animación
    this.errorTargetEl.classList.add('shake');
  }

  clearError() {
    if (this.errorTargetEl) this.errorTargetEl.classList.remove('error');
    if (this.supportEl) {
      this.supportEl.textContent = '';
      this.supportEl.classList.remove('error');
    }
  }

  next() {
    const field = this.currentField;
    const value = this.readCurrentValue();

    if (field.required && !value) {
      this.showError('Este campo es obligatorio.');
      return;
    }

    // Si cambian el destino ya elegido, la doca previa deja de ser válida
    if (field.id === 'destino' && this.values.destino && this.values.destino !== value) {
      delete this.values.doca;
      delete this.values.resultado;
    }

    this.values[field.id] = value;

    if (field.id === 'doca') {
      this.values.resultado = this.isNum(value) ? 'Sin incidencia' : 'Erroneo';
    }

    this.advance();
  }

  skip() {
    this.values[this.currentField.id] = '';
    this.advance();
  }

  advance() {
    if (this.isLastStep) {
      this.finish();
    } else {
      this.stepIndex++;
      this.renderStep();
    }
  }

  back() {
    this.stopScanner();
    if (this.stepIndex === 0) {
      if (this.onCancel) this.onCancel();
      return;
    }
    this.stepIndex--;
    this.renderStep();
  }

  finish() {
    this.stopScanner();
    if (this.onComplete) this.onComplete({ ...this.values });
  }
}
