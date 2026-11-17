// /agenda.ics: la agenda completa para suscribirse desde Google Calendar, iPhone, Outlook…
import { todosLosEventos, idEvento, hora } from "./_comun.js";

const VTZ = ["BEGIN:VTIMEZONE", "TZID:Europe/Madrid", "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST", "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET", "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD", "END:VTIMEZONE"];
const txt = s => String(s || "").replace(/\\/g, "\\\\").replace(/[,;]/g, m => "\\" + m).replace(/\r?\n/g, "\\n");
const plegar = l => { const out = []; let s = l; while (s.length > 74) { out.push(s.slice(0, 74)); s = " " + s.slice(74); } out.push(s); return out.join("\r\n"); };
const dia = (iso, mas = 0) => { const [a, m, d] = iso.slice(0, 10).split("-").map(Number); const f = new Date(Date.UTC(a, m - 1, d + mas)); return f.toISOString().slice(0, 10).replace(/-/g, ""); };

export async function onRequestGet(ctx) {
  const origen = new URL(ctx.request.url).origin;
  const eventos = await todosLosEventos(ctx);
  const ahora = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lineas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Costa Musical//Agenda//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Costa Musical · Agenda", "X-WR-TIMEZONE:Europe/Madrid", "X-WR-CALDESC:Conciertos, procesiones y cursos de la Asociación Cultural Costa Musical (Punta Umbría)",
    "REFRESH-INTERVAL;VALUE=DURATION:PT12H", "X-PUBLISHED-TTL:PT12H", ...VTZ];
  for (const ev of eventos) {
    const id = idEvento(ev), h = hora(ev), p2 = n => String(n).padStart(2, "0");
    const enlace = ev._tipo === "curso" ? `${origen}/cursos.html#${ev._curso}` : `${origen}/evento/${encodeURIComponent(id)}`;
    lineas.push("BEGIN:VEVENT", `UID:${id}@costamusical`, `DTSTAMP:${ahora}`);
    if (h && !ev.fecha_fin) {
      const fin = (h[0] + 2) % 24;
      lineas.push(`DTSTART;TZID=Europe/Madrid:${dia(ev.fecha)}T${p2(h[0])}${p2(h[1])}00`, `DTEND;TZID=Europe/Madrid:${dia(ev.fecha, h[0] + 2 >= 24 ? 1 : 0)}T${p2(fin)}${p2(h[1])}00`);
    } else {
      lineas.push(`DTSTART;VALUE=DATE:${dia(ev.fecha)}`, `DTEND;VALUE=DATE:${dia(ev.fecha_fin || ev.fecha, 1)}`);
    }
    lineas.push(`SUMMARY:${txt(ev.titulo)}`);
    if (ev.lugar) lineas.push(`LOCATION:${txt(ev.lugar)}`);
    lineas.push(`DESCRIPTION:${txt([ev.descripcion, ev.hora && ev.fecha_fin ? "Horario: " + ev.hora : "", enlace].filter(Boolean).join("\n\n"))}`, `URL:${enlace}`, "END:VEVENT");
  }
  lineas.push("END:VCALENDAR");
  return new Response(lineas.map(plegar).join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'inline; filename="costa-musical.ics"', "Cache-Control": "public, max-age=1800" }
  });
}
