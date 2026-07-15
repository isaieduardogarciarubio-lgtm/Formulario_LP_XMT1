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
        type: 'destino_picker',
        required: true,
      },
      {
        id: 'doca',
        label: '¿Cuál es la doca?',
        type: 'doca_picker',
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

  fury: {
    id: 'fury',
    title: 'FURY - Auditoría Contenedores',
    description: 'Captura fotos y situación de envío',
    icon: 'package',
    fields: [
      {
        id: 'shipment',
        label: '¿Cuál es el Shipment ID?',
        type: 'scanner',
        required: true,
        placeholder: 'Ej. SHIP123456',
      },
      {
        id: 'foto',
        label: 'Captura una foto',
        type: 'photo',
        required: true,
      },
      {
        id: 'situacion',
        label: '¿Cuál es la situación?',
        type: 'choice',
        required: true,
        options: [
          { value: 'Normal', label: 'Normal' },
          { value: 'Dañado', label: 'Dañado' },
          { value: 'Perdido', label: 'Perdido' },
        ],
      },
      {
        id: 'valor',
        label: 'Valor estimado (opcional)',
        type: 'number',
        required: false,
        placeholder: 'Ej. 1500',
      },
    ],
    csvColumns: [
      { field: 'ts', header: 'Fecha/Hora' },
      { field: 'shipment', header: 'Shipment' },
      { field: 'foto', header: 'Foto' },
      { field: 'situacion', header: 'Situación' },
      { field: 'valor', header: 'Valor' },
    ],
  },

  contenerizado: {
    id: 'contenerizado',
    title: 'Contenerizado - Auditoría de Carga',
    description: 'Valida estado de contenedor',
    icon: 'box',
    fields: [
      {
        id: 'shipment',
        label: '¿Cuál es el Shipment ID?',
        type: 'scanner',
        required: true,
        placeholder: 'Ej. SHIP123456',
      },
      {
        id: 'situacion',
        label: '¿Cuál es la situación?',
        type: 'choice',
        required: true,
        options: [
          { value: 'Normal', label: 'Normal' },
          { value: 'Dañado', label: 'Dañado' },
        ],
      },
      {
        id: 'foto',
        label: 'Foto del contenedor',
        type: 'photo',
        required: false,
        showIf: { field: 'situacion', value: 'Dañado' },
        valueWhenHidden: null,
      },
    ],
    csvColumns: [
      { field: 'ts', header: 'Fecha/Hora' },
      { field: 'shipment', header: 'Shipment' },
      { field: 'situacion', header: 'Situación' },
      { field: 'foto', header: 'Foto' },
    ],
  },

  linehaul: {
    id: 'linehaul',
    title: 'Linehaul - Despacho',
    description: 'Registra salida de unidades',
    icon: 'truck',
    fields: [
      {
        id: 'hu',
        label: '¿Cuál es el HU?',
        type: 'scanner',
        required: true,
        placeholder: 'Ej. HU123456789',
      },
      {
        id: 'area',
        label: '¿De cuál área es?',
        type: 'choice',
        required: true,
        options: [
          { value: 'Carga', label: 'Carga' },
          { value: 'Consolidación', label: 'Consolidación' },
          { value: 'Retorno', label: 'Retorno' },
        ],
      },
      {
        id: 'armado_sitio',
        label: '¿Armado en sitio?',
        type: 'choice',
        required: true,
        options: [
          { value: 'Sí', label: 'Sí' },
          { value: 'No', label: 'No' },
        ],
      },
      {
        id: 'origen',
        label: '¿Cuál es el origen?',
        type: 'text',
        required: false,
        showIf: { field: 'armado_sitio', value: 'No' },
        valueWhenHidden: 'XMT1',
        placeholder: 'Ej. XMT1',
      },
      {
        id: 'canalizacion',
        label: 'Canalización',
        type: 'text',
        required: true,
        placeholder: 'Ej. LOCAL',
      },
      {
        id: 'foto',
        label: 'Foto (opcional)',
        type: 'photo',
        required: false,
      },
      {
        id: 'comentarios',
        label: 'Comentarios (opcional)',
        type: 'textarea',
        required: false,
        placeholder: 'Ej. Unidad en buen estado',
      },
    ],
    csvColumns: [
      { field: 'ts', header: 'Fecha/Hora' },
      { field: 'hu', header: 'HU' },
      { field: 'area', header: 'Área' },
      { field: 'armado_sitio', header: 'Armado en Sitio' },
      { field: 'origen', header: 'Origen' },
      { field: 'canalizacion', header: 'Canalización' },
      { field: 'foto', header: 'Foto' },
      { field: 'comentarios', header: 'Comentarios' },
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

/**
 * Auto-detectar tipo de log por headers CSV
 */
function detectLogTypeFromHeaders(headers) {
  const normalized = headers.map(h => h.toLowerCase().trim());

  if (normalized.includes('resultado')) {
    return 'destino_doca';
  } else if (normalized.includes('shipment') && normalized.includes('situacion') && normalized.includes('foto')) {
    return normalized.includes('valor') ? 'fury' : 'contenerizado';
  } else if (normalized.includes('hu') && normalized.includes('area') && normalized.includes('canalizacion')) {
    return 'linehaul';
  }

  return null;
}

/**
 * Check if a form has photo fields
 */
function formHasPhotos(formId) {
  const form = FORMS_CONFIG[formId];
  return form && form.fields.some(f => f.type === 'photo');
}
