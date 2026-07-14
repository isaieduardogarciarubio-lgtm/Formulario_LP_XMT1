/**
 * Configuración de formularios
 * Cada formulario define sus campos y las columnas del CSV resultante
 */

const FORMS_CONFIG = {
  destino_doca: {
    id: 'destino_doca',
    title: 'Auditoría - Destino / Doca',
    description: 'Escanea HU, valida destino y doca',
    icon: 'scan',
    // Catálogo Destino → Docas válidas. Edita este archivo con los destinos
    // y docas reales de tu operación (columna Doca: valores separados por ";").
    catalogUrl: 'data/catalogo_destino_doca.csv',
    fields: [
      {
        id: 'hu',
        label: '¿Cuál es el HU?',
        type: 'scanner',
        required: true,
        placeholder: 'Ej. HU123456789',
      },
      {
        id: 'destino',
        label: '¿Cuál es el destino?',
        type: 'destino_combo',
        required: true,
      },
      {
        id: 'doca',
        label: '¿Cuál es la doca?',
        type: 'doca_combo',
        required: true,
      },
    ],
    csvColumns: [
      { field: 'ts', header: 'Fecha/Hora' },
      { field: 'hu', header: 'HU' },
      { field: 'destino', header: 'Destino' },
      { field: 'doca', header: 'Doca' },
      { field: 'resultado', header: 'Resultado' },
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
