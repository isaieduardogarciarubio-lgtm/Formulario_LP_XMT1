/**
 * Motor de generación de CSV
 * Genera CSV válido con escape de caracteres especiales, BOM UTF-8 y descarga real
 */

class CSVEngine {
  /**
   * Escapa un valor CSV: si contiene coma, comilla o salto de línea, lo encierra en comillas
   * y duplica las comillas internas
   */
  static escapeCsvValue(value) {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // Si contiene coma, comilla o salto de línea, escapar
    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
    ) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }

    return stringValue;
  }

  /**
   * Genera un CSV a partir de un array de registros y un config de formulario
   * Retorna string con BOM UTF-8 incluido
   */
  static generateCSV(records, formConfig) {
    if (!formConfig || !formConfig.csvColumns) {
      throw new Error('Configuración de formulario inválida');
    }

    if (!records || records.length === 0) {
      throw new Error('No hay registros para exportar');
    }

    // Línea de encabezados
    const headers = formConfig.csvColumns.map((col) => this.escapeCsvValue(col.header));
    const headerLine = headers.join(',');

    // Líneas de datos
    const dataLines = records.map((record) => {
      return formConfig.csvColumns
        .map((col) => this.escapeCsvValue(record[col.field] || ''))
        .join(',');
    });

    // Combina todo
    const csvContent = [headerLine, ...dataLines].join('\n');

    // BOM UTF-8 (permite que Excel/Calc interprete correctamente acentos)
    const bom = '﻿';
    const csvWithBom = bom + csvContent;

    return csvWithBom;
  }

  /**
   * Descarga un CSV al navegador
   * @param {string} csvContent - Contenido del CSV (incluyendo BOM)
   * @param {string} filename - Nombre del archivo (sin extensión .csv)
   */
  static downloadCSV(csvContent, filename) {
    // Crear blob con encoding UTF-8
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    // Crear URL descargable
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    // Agregar al DOM, hacer click, y limpiar
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Liberar la URL
    URL.revokeObjectURL(url);
  }

  /**
   * Genera nombre de archivo con timestamp
   */
  static generateFilename(formId, formTitle) {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const sanitized = formTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${sanitized}_${timestamp}`;
  }

  /**
   * Exporta registros a CSV y descarga
   */
  static exportAndDownload(records, formConfig) {
    try {
      const csvContent = this.generateCSV(records, formConfig);
      const filename = this.generateFilename(formConfig.id, formConfig.title);
      this.downloadCSV(csvContent, filename);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
