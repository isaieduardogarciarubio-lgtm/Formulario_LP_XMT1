# Guía: Manejo de Fechas y Horas en Apps de Grid

Extraído de bugs reales encontrados construyendo Barredura (Pre-Missort/Auditoría). Dos problemas distintos, dos soluciones distintas — no se deben confundir.

## Problema 1: Fechas de catálogo (texto libre, formato ambiguo)

**Síntoma real:** un catálogo traía `fecha_inbound = "4/08/2026 22:18:41"` (4 de agosto). El cálculo de "días en sitio" dio **117 días** en vez de 0.

**Causa:** `Date.parse("4/08/2026")` (y el constructor `new Date("4/08/2026")`) interpretan el string en formato **estadounidense MM/DD/YYYY**. Leyó "4/08" como **mes 4 (abril), día 8** en vez de **día 4, mes 8 (agosto)** — la convención que de verdad usa el dato (México/Latinoamérica: DD/MM/YYYY).

```js
Date.parse("4/08/2026")   // → 8 de abril de 2026 (¡mal!)
Date.parse("2026-08-04")  // → 4 de agosto de 2026 (bien, ISO no es ambiguo)
```

### Regla de oro

> **Nunca uses `Date.parse()` ni `new Date(string)` directo sobre una fecha que venga de un CSV/catálogo/input de usuario con separador `/` o `-` en formato corto.** Solo es seguro para ISO 8601 (`YYYY-MM-DD` o con hora `YYYY-MM-DDTHH:mm:ssZ`), porque ahí no hay ambigüedad de orden.

### Qué formatos hay que esperar de un catálogo real (Excel/Sheets exportado a CSV)

| Formato en la celda | Se ve así en el CSV | Riesgo |
|---|---|---|
| Fecha con separador `/` o `-`, año largo o corto | `04/08/2026`, `4-8-26` | **Ambiguo** DD/MM vs MM/DD |
| Fecha + hora 24h | `04/08/2026 22:18:41` | Igual que arriba, más hora |
| Fecha + hora con AM/PM | `04/08/2026 10:18 PM` | Igual, + hay que sumar 12h si es PM |
| Celda con formato "Fecha" real, exportada bien | `2026-08-04` (ISO) | Ninguno — usar `Date.parse` normal |
| Celda con formato "General"/"Número" en vez de fecha | `46247` (número serie de Excel) | Si no se detecta, se trata como texto y falla |

### La solución: parsear explícitamente, no adivinar

```js
/**
 * Parsea una fecha de catálogo tolerando los formatos reales de
 * Excel/Sheets exportado a CSV. DD/MM es la convención esperada — si el
 * día quedara >12 en la posición de mes (o viceversa), se corrige solo
 * porque ahí ya no es ambiguo. Para "4/08" (ambos ≤12) no hay forma de
 * saber con certeza sin el formato explícito, así que se asume DD/MM.
 */
function parseFechaConvencionMexicana(str) {
  const s = String(str || '').trim();
  if (!s) return NaN;

  // 1) Fecha serial de Excel: número puro. Excel cuenta días desde
  //    1899-12-30 (incluye el bug histórico del año bisiesto 1900).
  if (/^\d{4,6}(\.\d+)?$/.test(s)) {
    const serial = Number(s);
    const ms = Math.round((serial - 25569) * 86400 * 1000);
    if (!Number.isNaN(ms) && ms > 0) return ms;
  }

  // 2) DD/MM/YYYY o DD/MM/YY, separador "/" o "-", hora opcional 24h o AM/PM.
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?$/);
  if (m) {
    const [, a, b, yearStr, hhStr, minStr, ssStr, ampm] = m;
    let day = Number(a);
    let month = Number(b);
    // Si vino al revés (MM/DD) y solo esa lectura es válida, se corrige.
    if (month > 12 && day <= 12) { [day, month] = [month, day]; }
    const year = yearStr.length === 2 ? 2000 + Number(yearStr) : Number(yearStr);
    let hours = Number(hhStr || 0);
    if (ampm) {
      const isPM = /p/i.test(ampm);
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    }
    const d = new Date(year, month - 1, day, hours, Number(minStr || 0), Number(ssStr || 0));
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }

  // 3) Último recurso: Date.parse (cubre ISO y formatos sin ambigüedad).
  //    Si tampoco reconoce el valor, regístralo — no falles en silencio
  //    con un número que "se ve plausible" pero está mal (ej. 117 días
  //    en vez de 0 no se ve obviamente roto a simple vista).
  const fallback = Date.parse(s);
  if (Number.isNaN(fallback) && typeof DebugConsole !== 'undefined') {
    DebugConsole.log(`Fecha no reconocida: "${s}"`, 'warn');
  }
  return fallback;
}
```

### Checklist al construir cualquier feature que calcule algo a partir de una fecha de catálogo/CSV

- [ ] ¿El dato viene de un humano llenando Excel/Sheets? → asume ambigüedad DD/MM vs MM/DD, **no confíes en `Date.parse`**.
- [ ] ¿Puede la celda tener formato "General"/número en vez de fecha? → soporta fecha serial de Excel.
- [ ] ¿Puede traer hora con AM/PM? → soporta ambos.
- [ ] ¿Qué pasa si el valor no se reconoce? → debe caer a un estado vacío/visible (`NaN` → campo en blanco), **nunca** un número que parezca válido pero esté mal. Regístralo en la consola de debug para poder ajustarlo con el dato real.
- [ ] Prueba el parser con el valor **exacto** que trae el catálogo real antes de confiar en él — no solo con fechas "de juguete" tipo `2026-01-15`.

---

## Problema 2: Mostrar timestamps de captura (UTC vs hora local)

**Síntoma real:** un registro capturado "hace unos minutos" mostraba `ts = "2026-08-05T03:28:49.078Z"` en la tabla del dashboard, mientras el operador (en México, UTC-6) seguía en la noche del día 4. Parecía que la app "iba un día adelantada".

**Causa:** el registro se guarda correctamente con `new Date().toISOString()` (UTC, formato estándar, correcto para almacenamiento) — pero se **mostraba tal cual, sin convertir a hora local**, en la tabla del dashboard.

### Regla de oro

> **Guarda siempre en UTC ISO 8601** (`toISOString()`) — es lo correcto para almacenamiento, orden cronológico y CSV/exports (sin ambigüedad de zona horaria). **Pero nunca lo muestres crudo a un humano** — conviértelo a hora local antes de pintarlo en pantalla.

```js
// Guardar (siempre UTC, sin importar dónde esté el usuario):
const record = { ts: new Date().toISOString(), ... };

// Mostrar en pantalla (hora local del navegador del que lo ve):
new Date(record.ts).toLocaleString('es-MX', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});
// → "04/08/2026, 21:28:49" en vez de "2026-08-05T03:28:49.078Z"
```

Si solo necesitas la hora (ej. un historial reciente):

```js
new Date(record.ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
```

### Dónde aplicar esto

- **Cualquier tabla/lista que muestre un timestamp a un operador** → conviértelo a local antes de pintarlo.
- **CSV/export para descarga** → aquí es defendible dejarlo en UTC ISO (es el estándar de intercambio de datos, no ambiguo, ordenable). Si el CSV es para que alguien lo LEA directamente en Excel sin procesarlo, considera convertir también — depende de quién lo consume.
- **Comparaciones/cálculos internos** (dedup por ventana de tiempo, filtros de fecha, orden cronológico) → **siempre en UTC** (`Date.parse`/`Date.now()` sobre el ISO string), nunca conviertas a local para calcular — solo para mostrar.

### Checklist al agregar cualquier timestamp visible

- [ ] ¿Se guarda con `new Date().toISOString()`? → correcto, no cambiar.
- [ ] ¿Se muestra en una tabla/pantalla/notificación a un humano? → pasar por `toLocaleString('es-MX', {...})` antes de mostrarlo.
- [ ] ¿Se usa para dedup, filtros de fecha, u ordenar? → dejarlo en UTC/ISO, comparar con `Date.parse()` normal (ahí sí es seguro porque el formato ISO no es ambiguo).

---

## Resumen en una frase

- **Fechas de catálogo con `/` o `-` (no-ISO):** no confíes en `Date.parse` — parsea explícitamente asumiendo la convención real del dato (DD/MM en México), con fallback registrado.
- **Timestamps que tú generas (`ts`):** guarda en UTC siempre, pero conviértelos a hora local **solo al momento de mostrarlos** — nunca al guardarlos ni al calcular con ellos.
