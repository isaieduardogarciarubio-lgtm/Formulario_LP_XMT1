/**
 * Configuración de formularios
 * Cada formulario define sus campos y las columnas del CSV resultante
 */

/**
 * Catálogo Destino → Docas válidas para el log "Auditoría - Destino / Doca".
 * Edita este arreglo con los destinos y docas reales de tu operación.
 * `docas` acepta varios valores separados por punto y coma (ej. "1;2;3;A").
 */
const CATALOGO_DESTINO_DOCA = [
  { destino: 'Andén 1', docas: '1;2;3;4' },
  { destino: 'Andén 2', docas: '5;6;7;8' },
  { destino: 'Rack A', docas: 'A1;A2;A3' },
];

const FORMS_CONFIG = {
  destino_doca: {
    id: 'destino_doca',
    title: 'Auditoría - Destino / Doca',
    description: 'Escanea HU, valida destino y doca',
    icon: 'scan',
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
        type: 'destino_select',
        required: true,
      },
      {
        id: 'doca',
        label: '¿Cuál es la doca?',
        type: 'doca_chips',
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
