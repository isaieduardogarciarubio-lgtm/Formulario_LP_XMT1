/**
 * Motor de renderizado dinámico de formularios
 * Convierte una configuración en HTML interactivo
 */

class FormEngine {
  constructor(formConfig) {
    this.formConfig = formConfig;
    this.formElement = null;
  }

  /**
   * Renderiza un campo según su tipo
   */
  renderField(field) {
    const group = document.createElement('div');
    group.className = 'form-group';

    // Label
    const label = document.createElement('label');
    label.className = 'form-label' + (field.required ? ' required' : '');
    label.setAttribute('for', field.id);
    label.textContent = field.label;
    group.appendChild(label);

    // Input según tipo
    let input;

    if (field.type === 'select') {
      input = document.createElement('select');
      input.className = 'form-select';
      field.options.forEach((option) => {
        const optElement = document.createElement('option');
        optElement.value = option.value;
        optElement.textContent = option.label;
        input.appendChild(optElement);
      });
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.className = 'form-textarea';
      input.placeholder = field.placeholder || '';
    } else {
      input = document.createElement('input');
      input.type = field.type;
      input.className = 'form-input';
      input.placeholder = field.placeholder || '';

      if (field.min !== undefined) input.min = field.min;
      if (field.max !== undefined) input.max = field.max;
    }

    input.id = field.id;
    input.name = field.id;
    input.required = field.required;

    group.appendChild(input);
    return group;
  }

  /**
   * Renderiza todo el formulario
   */
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} no encontrado`);
      return;
    }

    // Crear formulario
    this.formElement = document.createElement('form');
    this.formElement.id = `form_${this.formConfig.id}`;
    this.formElement.className = 'form-container';

    // Renderizar campos
    this.formConfig.fields.forEach((field) => {
      this.formElement.appendChild(this.renderField(field));
    });

    container.appendChild(this.formElement);
  }

  /**
   * Valida el formulario y retorna los datos si es válido
   */
  getFormData() {
    if (!this.formElement.checkValidity()) {
      // Los navegadores muestran su propia validación, pero también podemos retornar null
      return null;
    }

    const formData = new FormData(this.formElement);
    const data = {};

    this.formConfig.fields.forEach((field) => {
      data[field.id] = formData.get(field.id) || '';
    });

    return data;
  }

  /**
   * Resetea el formulario
   */
  resetForm() {
    if (this.formElement) {
      this.formElement.reset();
    }
  }

  /**
   * Obtiene la instancia del elemento form HTML
   */
  getFormElement() {
    return this.formElement;
  }
}
