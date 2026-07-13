/**
 * Librería de iconos SVG — línea limpia, inspirada en la iconografía de Atlas/Andes
 * Trazo consistente (stroke-based), sin dependencias externas, sin emojis
 */

const Icons = (() => {
  const PATHS = {
    // Marca / navegación
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',

    // Formularios / documentos
    clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6M9 15h6"/>',
    star: '<path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6z" stroke-linejoin="round"/>',

    // Acciones
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M10 11v6M14 11v6"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15.4-6.4L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.4 6.4L3 16"/><path d="M3 21v-5h5"/>',

    // Estados / feedback
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    alertCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><circle cx="12" cy="16" r="0.75" fill="currentColor" stroke="none"/>',
    infoCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r="0.75" fill="currentColor" stroke="none"/>',
    inbox: '<path d="M4 12h4l1.5 3h5L16 12h4"/><path d="M6 5h12l2 7v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6z"/>',
  };

  /**
   * Devuelve el marcado SVG de un icono
   * @param {string} name - clave del icono
   * @param {object} opts - { size, strokeWidth, className }
   */
  function svg(name, opts = {}) {
    const path = PATHS[name];
    if (!path) {
      console.warn(`Icon "${name}" no existe`);
      return '';
    }

    const size = opts.size || 20;
    const strokeWidth = opts.strokeWidth || 1.8;
    const className = opts.className ? ` ${opts.className}` : '';

    return `<svg class="icon${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }

  return { svg };
})();
