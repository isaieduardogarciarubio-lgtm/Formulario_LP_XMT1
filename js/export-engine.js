/**
 * Motor de exportación — CSV + ZIP con fotos
 * Genera ZIPs con subfolderes por tipo de log cuando exporta múltiples logs
 */

class ExportEngine {
  constructor(logsData) {
    this.logsData = logsData; // { destino_doca: [], fury: [], contenerizado: [], linehaul: [] }
  }

  formHasPhotos(logType) {
    const config = FORMS_CONFIG[logType];
    return config && config.fields.some(f => f.type === 'photo');
  }

  photoFilename(index, shipmentId) {
    return `${String(index + 1).padStart(3, '0')}_${shipmentId}.jpg`;
  }

  dataUrlToBase64(dataUrl) {
    // Strip data:image/jpeg;base64, prefix
    return dataUrl.split(',')[1];
  }

  exportLogCsv(logType, records) {
    const config = FORMS_CONFIG[logType];
    if (!config) return null;

    const headers = config.csvColumns.map(c => c.header);
    const rows = records.map(record => {
      return config.csvColumns.map(col => {
        const value = record[col.field] || '';
        // Escape quotes in CSV
        return typeof value === 'string' && value.includes(',')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  async exportLogZip(logType, records) {
    // For a single log, create a ZIP with CSV + fotos subfolder
    if (!window.JSZip) {
      console.error('JSZip not loaded');
      return null;
    }

    const zip = new window.JSZip();
    const csvContent = this.exportLogCsv(logType, records);
    zip.file('data.csv', csvContent);

    if (this.formHasPhotos(logType)) {
      const fotos = zip.folder('fotos');
      const config = FORMS_CONFIG[logType];

      records.forEach((record, idx) => {
        config.fields.forEach(field => {
          if (field.type === 'photo' && record[field.id]) {
            const identifier = record.shipment || record.hu || `record_${idx}`;
            const filename = this.photoFilename(idx, identifier);
            const base64 = this.dataUrlToBase64(record[field.id]);
            fotos.file(filename, base64, { base64: true });
          }
        });
      });
    }

    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  }

  async exportAllZip(filename = 'consolidado_auditoria.zip') {
    // Create master ZIP with subfolder per log type
    if (!window.JSZip) {
      console.error('JSZip not loaded');
      return null;
    }

    const zip = new window.JSZip();
    const timestamp = new Date().toISOString().split('T')[0];

    for (const [logType, records] of Object.entries(this.logsData)) {
      if (records.length === 0) continue;

      const folderName = `${logType}_${timestamp}`;
      const folder = zip.folder(folderName);

      const csvContent = this.exportLogCsv(logType, records);
      folder.file('data.csv', csvContent);

      if (this.formHasPhotos(logType)) {
        const fotos = folder.folder('fotos');
        const config = FORMS_CONFIG[logType];

        records.forEach((record, idx) => {
          config.fields.forEach(field => {
            if (field.type === 'photo' && record[field.id]) {
              const identifier = record.shipment || record.hu || `record_${idx}`;
              const fname = this.photoFilename(idx, identifier);
              const base64 = this.dataUrlToBase64(record[field.id]);
              fotos.file(fname, base64, { base64: true });
            }
          });
        });
      }
    }

    return zip.generateAsync({
      type: 'blob',
      filename,
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
  }

  triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async exportAndDownload(logType = null) {
    let blob;
    let filename;

    if (logType) {
      const records = this.logsData[logType] || [];
      if (records.length === 0) {
        console.warn(`No records for ${logType}`);
        return;
      }
      blob = await this.exportLogZip(logType, records);
      filename = `${logType}_${new Date().toISOString().split('T')[0]}.zip`;
    } else {
      blob = await this.exportAllZip();
      filename = `consolidado_auditoria_${new Date().toISOString().split('T')[0]}.zip`;
    }

    if (blob) {
      this.triggerDownload(blob, filename);
    }
  }
}
