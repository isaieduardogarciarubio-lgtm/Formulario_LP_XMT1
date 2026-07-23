# 📊 Auditoría Grid — Captura + Dashboard

Sistema completo de auditoría integrado con Grid: captura de formularios en el navegador + dashboard de consolidación en tiempo real.

## 📂 Dos aplicaciones en una carpeta

1. **captura_auditoria.html** — Formulario de captura (esta sección)
2. **consolidado_auditoria.html** — Dashboard de análisis (documentado abajo)

---

# 🎤 Captura de Auditoría

Aplicación web de captura de auditorías integrada con Grid, soportando 5 logs con sincronización en tiempo real y almacenamiento offline.

## 🎯 Características (Captura)

- **5 Logs integrados**: Destino/Doca, FURY, Contenerizado, Linehaul, Inbound FM
- **Offline-first**: Almacenamiento en IndexedDB, sincronización automática al conectar
- **Escaneo nativo**: BarcodeDetector para HU, shipment, patente (plate)
- **Compresión de fotos**: WebP con fallback a JPEG (25% reducción de datos)
- **Sincronización inteligente**: Manejo de conflictos (409) con reintento exponencial
- **Diseño responsivo**: OLED minimalist, mobile-first, una pregunta por pantalla
- **Sin dependencias externas**: HTML/CSS/JS puro, autocontenido

## 🚀 Despliegue (Captura)

### Paso 1: Crear documento de datos en Grid

1. Ve a https://grid.melioffice.com
2. Crea un documento nuevo
3. Copia el `DOC_ID` de la URL: `https://grid.melioffice.com/d/{DOC_ID}/...`
4. Guarda este valor como `DATA_DOC_ID`

### Paso 2: Crear catálogo (opcional, pero recomendado)

Si usas el log "Pre-Missort" (destino/doca), necesitas un catálogo en el State Bucket `catalogo_destino_doca`:

```json
{
  "index": {
    "DESTINO_A": ["DOCA1", "DOCA2", "DOCA3"],
    "DESTINO_B": ["DOCA4", "DOCA5"]
  }
}
```

Publica este JSON en Grid (sección 23 de Biblia, State Buckets). El "Resultado" del registro se calcula automáticamente: si la doca elegida es puramente numérica → "Sin incidencia"; si no → "Erroneo" (mismo criterio que la app original).

### Paso 3: Subir captura_auditoria.html a Grid

1. Descarga `captura_auditoria.html` desde este repositorio
2. En Grid, crea un documento nuevo y sube el HTML
3. Copia el `HTML_DOC_ID` de la URL

### Paso 4: Abrir la aplicación

Abre con el parámetro `data_doc_id`:

```
https://grid.melioffice.com/d/{HTML_DOC_ID}/?data_doc_id={DATA_DOC_ID}
```

## 📋 Flujo de Uso (Captura)

1. **Operador abre la app** en Grid con `?data_doc_id=...`
2. **Elige un log** del menú (Destino/Doca, FURY, Contenerizado, etc.)
3. **Completa el formulario** — una pregunta por pantalla
4. **Escanea** HU/shipment/patente o ingresa manualmente
5. **Captura fotos** si es requerido (comprimidas automáticamente)
6. **Envía** → se guarda localmente en IndexedDB
7. **Sincronización automática**: Los registros se sincronizan a State Buckets si hay conexión
8. **Offline**: Los registros se almacenan en IndexedDB y se sincronizan al reconectar
9. **Revisa pendientes** en el badge "Sincronizar" en navbar

## 🏗️ Arquitectura (Captura)

### State Buckets (Grid)

Cada log tiene su propio bucket: `{formId}_master`

```javascript
{
  records: [
    {
      uid: "formId_timestamp_random",
      ts: "2026-07-23T10:30:00Z",
      formId: "destino_doca",
      hu: "2420997802886101",
      destino: "DESTINO_A",
      doca: "DOCA1",
      auditoria: "user@mercadolibre.com.mx - 2026-07-23"
    }
  ]
}
```

### Fotos

Las fotos se comprimen a WebP (o JPEG como fallback) y se suben como documentos públicos en Grid:

```javascript
{
  ...,
  foto: "01KXHHVWD581MQ567XEBW8HM5B",  // Grid doc_id
  ...
}
```

---

# 📊 Dashboard — Consolidado de Auditoría

Un **dashboard interactivo en Grid** que:
- Ingiere **CSVs o ZIPs** cargados manualmente (drag & drop)
- **Auto-detecta** tipo de log por headers CSV
- Descomprime ZIPs con fotos integradas (JSZip)
- Deduplica automático por timestamp + identificadores de log
- Consolida en **4 State Buckets independientes** (uno por tipo de log)
- Muestra **KPIs + gráficos Plotly + tabla filtrable** por log en tiempo real
- Permite **refresh manual** con reintento automático en conflictos
- **Descarga consolidada** en JSON

## 📋 Tipos de Log Soportados (Dashboard)

| Log | Campos | KPIs | Gráficos |
|-----|--------|------|----------|
| **Destino/Doca** | HU, Destino, Doca, Resultado (auto) | Total, Sin incidencia, Erroneo | Resultado (dona), Top Destinos (barras), Top Docas (barras) |
| **FURY** | Shipment, Foto, Situación, Valor (opt) | Total, por Situación | Situación (barras), Top Shipments (barras) |
| **Contenerizado** | Shipment, Situación, Foto (cond: si "Dañado") | Total, por Situación | Situación (barras), Top Shipments (barras) |
| **Linehaul** | HU, Área, Armado Sitio, Origen (cond), Canalización, Foto (opt), Comentarios (opt) | Total, por Área | Área (dona), Canalización (barras) |

## 🚀 Despliegue (Dashboard)

### Paso 1: Crear documentos de datos en Grid

El dashboard (consolidado_auditoria.html) requiere **un documento de datos dedicado** para los State Buckets.

```
UI de Grid:
1. Sube un archivo CSV vacío (o cualquier archivo pequeño)
2. Copia su doc_id de la URL: https://grid.melioffice.com/d/{DOC_ID}/...
```

Guarda ese `{DOC_ID}`.

### Paso 2: Subir el HTML a Grid

1. Descarga `grid/consolidado_auditoria.html`
2. Ve a https://grid.melioffice.com
3. Sube el archivo HTML como documento nuevo

Copia el `{HTML_DOC_ID}` de la URL.

### Paso 3: Abrir Dashboard

Abre con el data_doc_id en la URL:

```
https://grid.melioffice.com/d/{HTML_DOC_ID}/?data_doc_id={DATA_DOC_ID}
```

O hardcodeado en el HTML (editar línea ~490):
```javascript
this.docId = params.get('data_doc_id') || '{TU_DATA_DOC_ID}';
```

## 📋 Flujo de Uso (Dashboard)

1. **Operador llena formularios** en captura_auditoria.html (escanea, captura foto, sincroniza)
2. **Operador abre dashboard** (consolidado_auditoria.html) con `?data_doc_id=...`
3. **Dashboard se carga automáticamente** desde los 5 State Buckets
4. **Tabs de cada log** → KPIs, gráficos, tabla de registros
5. **Busca/filtra** en cada tabla
6. **Haz click en miniatura** de foto para ver en modal
7. **Refresh manual** con botón "Actualizar"
8. **Descarga consolidado** como JSON con todos los logs

## 🎨 Paleta de Colores (dataviz)

| Elemento | Color | Hex | Job |
|---|---|---|---|
| Success (Verde) | — | `#008300` | Sin incidencia, Normal |
| Critical (Rojo) | — | `#d03b3b` | Erroneo, Dañado, Perdido |
| Series (Azul) | — | `#3987e5` | Barras, líneas |
| Accent (Amarillo) | — | `#ffd100` | Botones, tabs activos |
| Surface Dark | — | `#1a1a19` | Fondo charts |

**Validación:** Paleta Nocturne + dataviz (CVD ΔE ≥8.4, normal-vision ΔE ≥15).

## 🔒 Seguridad & Restricciones (Biblia)

✅ **Sin localStorage**: 4 State Buckets independientes  
✅ **Identidad**: `GET /api/v1/me` para obtener email/avatar  
✅ **Optimistic concurrency**: `if_updated_at` en PUT → 409 = reintento automático  
✅ **Modales propios**: No usa `alert/confirm/prompt`  
✅ **Librerías locales**: Plotly + JSZip desde `/d/_libs/`  
✅ **Sin CDNs externos**: CSS + JS autocontenidos en HTML  

## 💾 Almacenamiento

**4 State Buckets** en el documento de datos:

```json
{
  "destino_doca_master": {
    "version": 1,
    "records": [
      {
        "ts": "2026-07-14T10:30:45Z",
        "hu": "HU123",
        "destino": "MXAMT1",
        "doca": "134",
        "resultado": "Sin incidencia"
      }
    ]
  },
  "fury_master": { "version": 1, "records": [...] },
  "contenerizado_master": { "version": 1, "records": [...] },
  "linehaul_master": { "version": 1, "records": [...] }
}
```

**Cada bucket:**
- Límite ~1 MB → ~16k registros @ 60 bytes c/u
- Deduplicación por: ts + hu + shipment + destino + doca
- Reintento automático en conflictos (409)

## 📥 Formatos de Entrada

### CSV
```
Fecha/Hora,HU,Destino,Doca,Resultado
2026-07-14 10:30:45,HU123,MXAMT1,134,Sin incidencia
```

Auto-detecta tipo por headers (case-insensitive):
- `resultado` → destino_doca
- `shipment + situacion + foto + valor` → fury
- `shipment + situacion + foto` (sin valor) → contenerizado
- `hu + area + canalizacion` → linehaul

### ZIP
```
destino_doca_2026-07-14/
├── data.csv
└── fotos/
    ├── 001_HU123.jpg
    └── 002_HU124.jpg

fury_2026-07-14/
├── data.csv
└── fotos/
    ├── 001_SHIP123.jpg
    └── 002_SHIP124.jpg
```

Los ZIPs contienen CSVs + subcarpeta `fotos/` con imágenes JPEG. El app:
1. Descomprime ZIP
2. Lee CSV de cada carpeta → detecta log type
3. Extrae fotos → las convierte a data URLs
4. Inserta datos + fotos en State Bucket

## 📊 Gráficos Por Log

| Log | Gráfico 1 | Gráfico 2 | Gráfico 3 |
|-----|-----------|-----------|-----------|
| **Destino/Doca** | Resultado (dona: verde/rojo) | Top 8 Destinos (barras) | Top 8 Docas (barras) |
| **FURY** | Situación (barras) | Top 10 Shipments (barras) | — |
| **Contenerizado** | Situación (barras) | Top 10 Shipments (barras) | — |
| **Linehaul** | Área (dona) | Canalización (barras) | — |

Todos con tema Nocturne: fondo #1a1a19, texto blanco, sin modo bar.

## 🐛 Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| "No autenticado" | No en VPN Grid | Conecta a VPN + inicia sesión en Grid UI |
| Tabla vacía | No se cargó el bucket | Verifica `data_doc_id` en URL |
| "JSZip undefined" | `/d/_libs/jszip.min.js` falta | Contacta admin Grid |
| CSV rechazado | Headers no coinciden | Verifica headers exactos (mayús/minús) |
| Fotos no se ven | Nombres de archivo no coinciden | Chequea CSV referencia foto: `001_SHIPID.jpg` |
| 409 Conflict | Dos usuarios escriben simultáneamente | App reintenta automático en 500-1000ms |
| Gráficos en blanco | Plotly no cargó | Verifica `/d/_libs/plotly.min.js` |

## 🔄 Auto-Polling

- **Manual:** Botón "Actualizar" en navbar → recarga desde State Buckets
- Reintento automático en conflictos (409): 500-1000ms + backoff exponencial

## 📤 Descarga

- **JSON consolidado**: Botón "Descargar" en navbar
- Contiene: `{ logs: { destino_doca: [...], fury: [...], contenerizado: [...], linehaul: [...] } }`
- Timestamp: `consolidado_AAAA-MM-DD.json`

## 📝 Licencia

Uso interno MercadoLibre.

## 🔗 Links

- **Generador de CSV (GitHub Pages)**: https://isaieduardogarciarubio-lgtm.github.io/formulario_lp_xmt1/
- **Biblia Grid V11.4**: Sección 23 (State Buckets), Sección 19 (Concurrency), Sección 24 (Folders API)
- **dataviz skill**: Asignación de colores por job (categorical, sequential, status)
