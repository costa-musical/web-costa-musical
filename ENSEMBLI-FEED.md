# Calendario público de Ensembli: formato para webs externas

Propuesta para que Ensembli publique los eventos públicos de **cualquier** organización. Así la web de cada banda (Costa Musical u otra) los muestra sin copiarlos a mano.

## Principios

1. **Es genérico, no es de Costa Musical.** El enlace depende del identificador de cada organización. No hay nada específico de una banda en el código de Ensembli.
2. **Visibilidad por evento.** Cada evento tiene un campo `visibilidad` con dos valores:
   - `interno` (valor por defecto): ensayos, convocatorias, logística.
   - `publico`: conciertos y actuaciones que se pueden anunciar.
   El feed **solo** devuelve los públicos.
3. **Sin datos personales.** Nunca salen nombres de músicos, asistencia, teléfonos ni notas internas.
4. **CORS abierto** (`Access-Control-Allow-Origin: *`) en este endpoint, para que cualquier web lo pueda leer desde el navegador.

## Endpoints

```
GET /api/public/{organizacion}/eventos.json     → para webs (lo que usa esta web)
GET /api/public/{organizacion}/eventos.ics      → para suscribirse desde Google Calendar, iPhone, etc.
GET /api/public/{organizacion}/eventos.json?agrupacion=banda   → filtrado opcional
```

`{organizacion}` es el identificador corto de la organización en Ensembli (por ejemplo `costa-musical`). Cada banda que use Ensembli tiene el suyo.

## Respuesta JSON

```json
{
  "organizacion": "Asociación Cultural Costa Musical",
  "actualizado": "2026-11-15T10:00:00+01:00",
  "eventos": [
    {
      "id": "evt_8f2c",
      "titulo": "Concierto de Santa Cecilia",
      "inicio": "2026-11-22T12:30:00+01:00",
      "fin": "2026-11-22T14:00:00+01:00",
      "lugar": "Teatro del Mar, Punta Umbría",
      "agrupacion": "banda",
      "descripcion": "El día de la patrona de la música.",
      "gratis": true
    }
  ]
}
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `titulo` | Sí | |
| `inicio` | Sí | ISO 8601 con zona horaria |
| `fin` | No | |
| `lugar` | No | |
| `agrupacion` | No | Debe coincidir con el `id` de la agrupación en la web (`banda`, `orquesta`, `big-band`…). En Ensembli corresponde al *ensemble* del evento. |
| `descripcion` | No | Texto corto, sin HTML |
| `gratis` | No | `true` muestra «Entrada libre» |

La web solo muestra eventos desde hoy en adelante, ordenados por fecha. Si el feed no responde, la agenda sigue mostrando lo que haya en `content/agenda.json`.

## Lo que esto aporta a Ensembli como producto

- Cada banda que use Ensembli gana una agenda pública que se actualiza sola en su web, en Google Calendar y en un widget.
- El mismo endpoint permite más adelante un **widget incrustable** (`<script src=".../widget.js" data-org="...">`), para bandas que no tienen web propia.
