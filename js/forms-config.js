/**
 * Configuración de formularios
 * Cada formulario define sus campos y las columnas del CSV resultante
 */
const FORMS_CONFIG = {
  contact_form: {
    id: 'contact_form',
    title: 'Formulario de Contacto',
    description: 'Recopila información de contacto de clientes',
    icon: 'clipboard',
    fields: [
      {
        id: 'name',
        label: 'Nombre Completo',
        type: 'text',
        required: true,
        placeholder: 'Juan Pérez García',
      },
      {
        id: 'email',
        label: 'Correo Electrónico',
        type: 'email',
        required: true,
        placeholder: 'juan@example.com',
      },
      {
        id: 'phone',
        label: 'Teléfono',
        type: 'tel',
        required: false,
        placeholder: '+52 55 1234 5678',
      },
      {
        id: 'company',
        label: 'Empresa',
        type: 'text',
        required: false,
        placeholder: 'Acme Corp',
      },
      {
        id: 'country',
        label: 'País',
        type: 'select',
        required: true,
        options: [
          { value: '', label: 'Selecciona un país' },
          { value: 'MX', label: 'México' },
          { value: 'CO', label: 'Colombia' },
          { value: 'AR', label: 'Argentina' },
          { value: 'CL', label: 'Chile' },
          { value: 'BR', label: 'Brasil' },
        ],
      },
      {
        id: 'message',
        label: 'Mensaje',
        type: 'textarea',
        required: true,
        placeholder: 'Escribe tu mensaje aquí...',
      },
    ],
    csvColumns: [
      { field: 'name', header: 'Nombre' },
      { field: 'email', header: 'Correo' },
      { field: 'phone', header: 'Teléfono' },
      { field: 'company', header: 'Empresa' },
      { field: 'country', header: 'País' },
      { field: 'message', header: 'Mensaje' },
    ],
  },

  survey_form: {
    id: 'survey_form',
    title: 'Encuesta de Satisfacción',
    description: 'Evalúa la satisfacción del cliente con nuestros servicios',
    icon: 'star',
    fields: [
      {
        id: 'respondent_name',
        label: 'Nombre del Encuestado',
        type: 'text',
        required: true,
        placeholder: 'María López',
      },
      {
        id: 'survey_date',
        label: 'Fecha de la Encuesta',
        type: 'date',
        required: true,
      },
      {
        id: 'service_rating',
        label: 'Calificación del Servicio (1-5)',
        type: 'number',
        required: true,
        min: 1,
        max: 5,
        placeholder: '5',
      },
      {
        id: 'product_quality',
        label: 'Calidad del Producto',
        type: 'select',
        required: true,
        options: [
          { value: '', label: 'Selecciona una opción' },
          { value: 'excellent', label: 'Excelente' },
          { value: 'good', label: 'Bueno' },
          { value: 'fair', label: 'Regular' },
          { value: 'poor', label: 'Malo' },
        ],
      },
      {
        id: 'recommend',
        label: '¿Recomendarías nuestro servicio?',
        type: 'select',
        required: true,
        options: [
          { value: '', label: 'Selecciona una opción' },
          { value: 'yes', label: 'Sí' },
          { value: 'no', label: 'No' },
          { value: 'maybe', label: 'Quizás' },
        ],
      },
      {
        id: 'feedback',
        label: 'Comentarios Adicionales',
        type: 'textarea',
        required: false,
        placeholder: 'Cuéntanos qué podemos mejorar...',
      },
    ],
    csvColumns: [
      { field: 'respondent_name', header: 'Nombre' },
      { field: 'survey_date', header: 'Fecha' },
      { field: 'service_rating', header: 'Calificación' },
      { field: 'product_quality', header: 'Calidad del Producto' },
      { field: 'recommend', header: '¿Recomendaría?' },
      { field: 'feedback', header: 'Comentarios' },
    ],
  },
};

/**
 * Obtener todas las formas disponibles
 */
function getAllForms() {
  return Object.values(FORMS_CONFIG);
}

/**
 * Obtener una forma por su ID
 */
function getFormConfig(formId) {
  return FORMS_CONFIG[formId];
}
