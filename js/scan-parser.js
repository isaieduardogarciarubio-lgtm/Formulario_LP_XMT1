/**
 * Parseo y validación de códigos escaneados (HU / Shipment ID)
 *
 * El escáner del almacén a veces entrega el identificador limpio como texto
 * plano, y otras veces lo envuelve en un JSON con metadata, por ejemplo:
 *   HU:        {"id":"e281a6b1-...-f2c726243f44","legacy_id":"2420997802886101","t":"hu"}
 *   Shipment:  {"id":"47326091753","t":"lm"}
 * El identificador operativo siempre es una cadena numérica. Si el JSON trae
 * "legacy_id" ese es el valor correcto (el "id" ahí es un UUID interno, no
 * el identificador de negocio); si no hay "legacy_id" se usa "id".
 * Cualquier código que no se ajuste a este formato se rechaza.
 */
const ScanParser = (() => {
  const ID_PATTERN = /^[0-9]{6,20}$/;

  /**
   * Extrae el identificador crudo del texto escaneado, sea JSON o texto plano.
   * Devuelve null si el JSON es válido pero no trae ni legacy_id ni id.
   */
  function extract(raw) {
    const text = String(raw || '').trim();
    if (!text) return null;

    if (text[0] === '{') {
      try {
        const obj = JSON.parse(text);
        if (obj && typeof obj === 'object') {
          if (obj.legacy_id != null) return String(obj.legacy_id).trim();
          if (obj.id != null) return String(obj.id).trim();
        }
        return null;
      } catch (e) {
        return null;
      }
    }

    return text;
  }

  /**
   * Extrae y valida el identificador. Devuelve el ID limpio (solo dígitos)
   * o null si el código no tiene el formato esperado.
   */
  function parse(raw) {
    const value = extract(raw);
    if (value == null) return null;
    return ID_PATTERN.test(value) ? value : null;
  }

  return { parse, extract, ID_PATTERN };
})();
