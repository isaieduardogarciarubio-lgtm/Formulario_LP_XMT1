/**
 * Lógica central de la aplicación
 * Maneja navegación, estado de registros y flujo general
 */

class FormApp {
  constructor() {
    this.currentForm = null;
    this.currentFormEngine = null;
    this.records = []; // Registros acumulados en la sesión
    this.init();
  }

  init() {
    this.attachMenuListeners();
    this.showMenu();
  }

  /**
   * Muestra el menú inicial con selector de formularios
   */
  showMenu() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    // Crear contenedor
    const content = document.createElement('div');
    content.className = 'content';
    content.innerHTML = `
      <div class="text-center">
        <h2 style="margin-bottom: 2rem; color: var(--color-primary);">Generador de CSV</h2>
        <p style="margin-bottom: 2rem; color: var(--color-text-secondary);">
          Selecciona un formulario para comenzar
        </p>
      </div>
    `;

    // Grilla de formularios
    const grid = document.createElement('div');
    grid.className = 'forms-grid';

    getAllForms().forEach((form) => {
      const card = document.createElement('div');
      card.className = 'form-card';
      card.innerHTML = `
        <div class="form-card-title">${form.icon} ${form.title}</div>
        <div class="form-card-desc">${form.description}</div>
        <div class="form-card-meta">${form.fields.length} campos</div>
      `;
      card.addEventListener('click', () => this.showFormPage(form.id));
      grid.appendChild(card);
    });

    content.appendChild(grid);
    app.appendChild(content);

    this.updateNavbar('Menú Principal');
  }

  /**
   * Muestra la página de un formulario específico
   */
  showFormPage(formId) {
    const formConfig = getFormConfig(formId);
    if (!formConfig) {
      alert('Formulario no encontrado');
      return;
    }

    this.currentForm = formConfig;
    this.currentFormEngine = new FormEngine(formConfig);

    const app = document.getElementById('app');
    app.innerHTML = '';

    // Contenedor principal
    const content = document.createElement('div');
    content.className = 'content';

    // Sección del formulario
    const formSection = document.createElement('div');
    formSection.className = 'card';
    formSection.style.maxWidth = '600px';

    const formTitle = document.createElement('h3');
    formTitle.style.marginBottom = 'var(--spacing-lg)';
    formTitle.innerHTML = `${formConfig.icon} ${formConfig.title}`;
    formSection.appendChild(formTitle);

    const formContainer = document.createElement('div');
    formContainer.id = 'form_container';
    formSection.appendChild(formContainer);

    // Botones
    const buttonGroup = document.createElement('div');
    buttonGroup.style.display = 'flex';
    buttonGroup.style.gap = 'var(--spacing-md)';
    buttonGroup.style.marginTop = 'var(--spacing-lg)';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary btn-block';
    submitBtn.textContent = 'Agregar Registro';
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.addRecord();
    });

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-secondary';
    resetBtn.textContent = 'Limpiar Formulario';
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.currentFormEngine.resetForm();
    });

    buttonGroup.appendChild(submitBtn);
    buttonGroup.appendChild(resetBtn);
    formSection.appendChild(buttonGroup);

    content.appendChild(formSection);

    // Sección de registros acumulados
    if (this.records.length > 0) {
      const recordsSection = document.createElement('div');
      recordsSection.className = 'card';
      recordsSection.style.marginTop = 'var(--spacing-lg)';

      const recordsTitle = document.createElement('h3');
      recordsTitle.style.marginBottom = 'var(--spacing-md)';
      recordsTitle.textContent = `Registros Acumulados (${this.records.length})`;
      recordsSection.appendChild(recordsTitle);

      const table = this.renderRecordsTable();
      recordsSection.appendChild(table);

      // Botones de acción
      const actionButtonGroup = document.createElement('div');
      actionButtonGroup.style.display = 'flex';
      actionButtonGroup.style.gap = 'var(--spacing-md)';
      actionButtonGroup.style.marginTop = 'var(--spacing-lg)';

      const exportBtn = document.createElement('button');
      exportBtn.className = 'btn btn-primary btn-block';
      exportBtn.textContent = '📥 Descargar CSV';
      exportBtn.addEventListener('click', () => this.exportToCSV());

      const clearBtn = document.createElement('button');
      clearBtn.className = 'btn btn-secondary btn-block';
      clearBtn.textContent = 'Limpiar Todo';
      clearBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro? Se perderán todos los registros.')) {
          this.records = [];
          this.showFormPage(formId);
        }
      });

      actionButtonGroup.appendChild(exportBtn);
      actionButtonGroup.appendChild(clearBtn);
      recordsSection.appendChild(actionButtonGroup);

      content.appendChild(recordsSection);
    } else {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <div class="empty-state-icon">📭</div>
        <p>Aún no hay registros. Completa el formulario y haz click en "Agregar Registro".</p>
      `;
      content.appendChild(emptyState);
    }

    app.appendChild(content);

    // Renderizar el formulario
    this.currentFormEngine.render('form_container');

    // Actualizar navbar
    this.updateNavbar(formConfig.title);
  }

  /**
   * Agrega un registro desde el formulario
   */
  addRecord() {
    const data = this.currentFormEngine.getFormData();
    if (!data) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    // Validar que al menos un campo no esté vacío
    const hasData = Object.values(data).some((v) => v.trim() !== '');
    if (!hasData) {
      alert('Por favor completa al menos un campo.');
      return;
    }

    this.records.push(data);

    // Feedback visual
    this.showAlert(`Registro agregado (total: ${this.records.length})`, 'success');

    // Limpiar formulario
    this.currentFormEngine.resetForm();

    // Refrescar vista (mostrar tabla)
    setTimeout(() => {
      this.showFormPage(this.currentForm.id);
    }, 500);
  }

  /**
   * Elimina un registro por índice
   */
  deleteRecord(index) {
    if (confirm('¿Eliminar este registro?')) {
      this.records.splice(index, 1);
      this.showAlert('Registro eliminado', 'success');
      setTimeout(() => {
        this.showFormPage(this.currentForm.id);
      }, 300);
    }
  }

  /**
   * Renderiza tabla de registros
   */
  renderRecordsTable() {
    const table = document.createElement('table');
    table.className = 'records-table';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    this.currentForm.csvColumns.forEach((col) => {
      const th = document.createElement('th');
      th.textContent = col.header;
      headerRow.appendChild(th);
    });

    // Columna de acciones
    const thAction = document.createElement('th');
    thAction.textContent = 'Acciones';
    thAction.style.width = '100px';
    headerRow.appendChild(thAction);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    this.records.forEach((record, index) => {
      const row = document.createElement('tr');

      this.currentForm.csvColumns.forEach((col) => {
        const td = document.createElement('td');
        const value = record[col.field] || '';
        // Truncar valores muy largos
        td.textContent = value.length > 50 ? value.substring(0, 50) + '...' : value;
        td.title = value;
        row.appendChild(td);
      });

      // Botón de eliminación
      const tdAction = document.createElement('td');
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-secondary btn-sm action-btn';
      deleteBtn.textContent = '🗑️ Borrar';
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
      this.showAlert('CSV descargado exitosamente ✓', 'success');
      // Opcional: limpiar registros después de exportar
      // this.records = [];
      // this.showFormPage(this.currentForm.id);
    } else {
      this.showAlert(`Error: ${result.error}`, 'error');
    }
  }

  /**
   * Muestra una alerta temporal
   */
  showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.position = 'fixed';
    alert.style.top = 'var(--spacing-md)';
    alert.style.right = 'var(--spacing-md)';
    alert.style.maxWidth = '400px';
    alert.style.zIndex = '9999';

    document.body.appendChild(alert);

    setTimeout(() => {
      alert.remove();
    }, 3000);
  }

  /**
   * Actualiza el navbar con el título actual
   */
  updateNavbar(title) {
    const navContent = document.getElementById('navbar_content');
    if (navContent) {
      navContent.innerHTML = `
        <span class="navbar-brand">${title}</span>
        <div class="navbar-actions">
          <button class="btn btn-secondary btn-sm" onclick="app.showMenu()">
            ← Volver al Menú
          </button>
        </div>
      `;
    }
  }

  /**
   * Adjunta listeners a elementos del menú
   */
  attachMenuListeners() {
    // Se hace dinámicamente al renderizar
  }
}

// Instancia global
let app;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  app = new FormApp();
});
