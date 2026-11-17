// Utilidades compartidas por las funciones del servidor (Cloudflare Pages)
export const slug = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const idEvento = ev => ev.id || `${ev.fecha}-${slug(ev.titulo)}`;
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export async function json(ctx, ruta) {
  const r = await ctx.env.ASSETS.fetch(new URL(ruta, ctx.request.url));
  if (!r.ok) return null;
  try { return await r.json(); } catch (_) { return null; }
}

// Hora "12:00", "20.30 h", "21h" -> [h, m]
export function hora(ev) {
  const m = String(ev.hora || "").match(/\b(\d{1,2})\s*(?:[:.](\d{2})|h\b)/i);
  return m && +m[1] < 24 ? [+m[1], +(m[2] || 0)] : null;
}
// Desfase horario de Madrid para una fecha (+01:00 invierno, +02:00 verano)
export function desfaseMadrid(a, m, d) {
  const ultDom = (mes) => { const x = new Date(Date.UTC(a, mes + 1, 0)); x.setUTCDate(x.getUTCDate() - x.getUTCDay()); return x.getUTCDate(); };
  const ini = ultDom(2), fin = ultDom(9); // último domingo de marzo y de octubre
  const verano = (m > 3 && m < 10) || (m === 3 && d >= ini) || (m === 10 && d < fin);
  return verano ? "+02:00" : "+01:00";
}
export function fechaTexto(ev) {
  const [a, m, d] = String(ev.fecha).slice(0, 10).split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  const base = ev.fecha_texto ? `${ev.fecha_texto} de ${a}` : `${DIAS[f.getUTCDay()]} ${d} de ${MESES[m - 1]} de ${a}`;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// Todos los eventos: agenda + encuentros de cursos
export async function todosLosEventos(ctx) {
  const [ag, cu, ens] = await Promise.all([json(ctx, "/content/agenda.json"), json(ctx, "/content/cursos.json"), json(ctx, "/content/agrupaciones.json")]);
  const porId = {}; ((ens && ens.agrupaciones) || []).forEach(e => { porId[e.id] = e; });
  const lista = ((ag && ag.eventos) || []).filter(e => e && e.fecha).map(e => ({ ...e, _tipo: e.tipo || "concierto", _agr: porId[e.agrupacion] }));
  ((cu && cu.cursos) || []).forEach(c => (c.encuentros || []).filter(x => x && x.fecha).forEach((x, i, t) => lista.push({
    titulo: x.titulo ? `${c.titulo}: ${x.titulo}` : (t.length > 1 ? `${c.titulo} (encuentro ${i + 1})` : c.titulo),
    fecha: x.fecha, fecha_fin: x.fecha_fin, hora: x.horario || "", lugar: x.lugar || c.lugar || "", descripcion: c.resumen || "",
    cartel: x.cartel || c.foto || "", _tipo: "curso", _curso: c.id, id: `curso-${c.id}-${x.fecha}`
  })));
  return lista;
}
