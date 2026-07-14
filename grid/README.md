# 📊 Consolidado de Auditoría — Grid

App de consolidación en vivo para CSVs de auditoría (Destino / Doca) generados por la herramienta de GitHub Pages.

## 🎯 Qué es

Un **dashboard interactivo en Grid** que:
- Ingiere CSVs cargados manualmente (drag & drop)
- Los deduplicacon automático (por Fecha/Hora + HU + Destino + Doca)
- Consolida en un **log maestro persistente** (State Bucket en un documento de datos de Grid)
- Muestra **KPIs, gráficos (Plotly) y tabla filtrable** en tiempo real
- Permite **refresco automático** cada 30 min + manual bajo demanda
- **Export consolidado** a CSV

## 🚀 Despliegue

### Paso 1: Crear documento de datos en Grid

Este app requiere un **documento de datos dedicado** que aloje el State Bucket (el log maestro).

```bash
# Opción A: Manual en la UI de Grid
# 1. Sube cualquier archivo (p. ej., un CSV vacío)
# 2. Copia su doc_id de la URL: https://grid.adminml.com/d/{DOC_ID}/...
```

Guarda ese `{DOC_ID}` — lo necesitarás en Paso 3.

### Paso 2: Subir el HTML a Grid

**Opción A: Via herramienta web**
1. Descarga `grid/consolidado_auditoria.html`
2. Ve a https://grid.melioffice.com (o grid.adminml.com)
3. Sube el archivo HTML

**Opción B: Via API (engine/run)**
```bash
curl -X POST https://grid.melioffice.com/api/v1/engine/run \
  -F "file=@grid/consolidado_auditoria.html" \
  -F "title=Consolidado de Auditoría" \
  -F "description=Panel en vivo — Destino/Doca" \
  -H "Authorization: Bearer <tu-api-token>"
```

Copia el `doc_id` de la respuesta.

### Paso 3: Pasar el doc_id del dato al HTML

El HTML espera el `doc_id` del documento de datos vía query param. Cuando abras el dashboard, pasa:

```
https://grid.melioffice.com/d/{HTML_DOC_ID}/?doc_id={DATA_DOC_ID}
```

Donde:
- `{HTML_DOC_ID}`: el doc_id del HTML que subiste en Paso 2
- `{DATA_DOC_ID}`: el doc_id del documento de datos que creaste en Paso 1

**Alternativa:** El app intenta leer `window.GRID.doc_id` automáticamente si Grid lo proporciona.

## 📋 Flujo de Uso

1. **Operador en GitHub Pages**: Captura HU, Destino, Doca → exporta CSV
2. **Operador abre dashboard en Grid** con `?doc_id=...`
3. **Drag & drop del CSV** → se valida, deduplicacon, merge con Estado Maestro
4. **Panel actualiza en vivo** → KPIs, gráficos, tabla
5. **Admin**: puede **Descargar** consolidado o **Limpiar** cuando cierre turno

## 🎨 Paleta de Colores (dataviz)

| Elemento | Color | Hex | Job |
|---|---|---|---|
| Sin incidencia | Verde | `#008300` | Success (categorical) |
| Erroneo | Rojo | `#d03b3b` | Critical (status) |
| Tendencia temporal | Azul | `#3987e5` | Sequential |
| Fondo chart | — | `#1a1a19` | Dark surface |

**Validación:** Paleta pasó todos los checks dataviz (CVD ΔE ≥8.4, normal-vision ΔE ≥15).

## 🔒 Seguridad & Restricciones de la Biblia

✅ **Sin localStorage**: Usa State Buckets (Grid API)  
✅ **Identidad por VPN**: `GET /api/v1/me` para `uploaded_by`  
✅ **Control optimista**: `if_updated_at` en bucket nombrado (`auditoria_master`) → 409 real  
✅ **Modales propios**: No usa `alert/confirm/prompt` (bloqueados en iframe)  
✅ **Librerías locales**: Plotly desde `/d/_libs/`  
✅ **Sin CDNs externos**: CSS + JS autocontenidos  

## 📊 Gráficos

| Gráfico | Tipo | Data Job | Color |
|---|---|---|---|
| Distribución Resultado | Dona | Categorical (2 series) | Verde/Rojo |
| Top Destinos | Barras | Categorical (hasta 8 slots) | Azul |
| Top Docas | Barras | Categorical | Verde |
| Tendencia Temporal | Línea | Sequential | Azul |

**Nota:** Con >8 series en una forma "all-pairs" (scatter, choropleth), se limita a primeros 4 slots + "Other". Acá no aplica (barras son adyacentes).

## 💾 Almacenamiento

**State Bucket: `auditoria_master`** en documento de datos

```json
{
  "version": 1,
  "records": [
    {
      "ts": "14/7/2026, 10:30:45",
      "hu": "HU123",
      "destino": "MXAMT1",
      "doca": "134",
      "resultado": "Sin incidencia",
      "uploaded_by": "igarciarubio@ml.com",
      "uploaded_at": "2026-07-14T10:30:45Z"
    }
  ]
}
```

**Límite de tamaño:** ~1 MB → ~16k registros de 60 bytes c/u.  
**Recomendación:** Botón "Archivar" (vuelca el consolidado a CSV/versión nueva, limpia bucket).

## 🔄 Refresco & Polling

- **Auto:** Cada 30 minutos → re-lee el bucket, actualiza gráficos
- **Manual:** Botón "Actualizar" en navbar → refrescar ya

## 📥 CSV de Entrada

**Schema esperado:**
```
Fecha/Hora,HU,Destino,Doca,Resultado
14/7/2026, 10:30:45,HU123,MXAMT1,134,Sin incidencia
14/7/2026, 10:31:12,HU124,MXAMT1,PDT,Erroneo
```

**Validación:** El app rechaza CSVs sin estos headers exactos (case-insensitive).

## 🐛 Troubleshooting

| Problema | Solución |
|---|---|
| "No autenticado" | Asegúrate de estar en VPN Grid + inicia sesión en Grid UI primero |
| "doc_id no encontrado" | Pasa `?doc_id=...` en la URL o crea un documento de datos |
| "409 conflict" | Dos operadores escriben a la vez → app reintenta merge automático |
| Plotly no carga | Verifica `/d/_libs/plotly.min.js` existe en tu entorno Grid |

## 📝 Licencia

Uso interno MercadoLibre.

## 🔗 Links

- **Generador CSV**: https://isaieduardogarciarubio-lgtm.github.io/formulario_lp_xmt1/
- **Biblia Grid V11.4**: Sección 23 (State Buckets), Sección 19 (Checkout Lock)
- **dataviz skill**: Método para asignar colores por job (categorical, sequential, diverging, status)
