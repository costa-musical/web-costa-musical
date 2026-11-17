// /sitemap.xml: lista de páginas para Google
import { json, idEvento } from "./_comun.js";
export async function onRequestGet(ctx) {
  const origen = new URL(ctx.request.url).origin;
  const ag = await json(ctx, "/content/agenda.json");
  const paginas = ["/", "/agenda.html", "/historia.html", "/cursos.html", "/galeria.html", "/unete.html", "/contrataciones.html", "/noticias.html", "/agrupacion.html"];
  const ev = ((ag && ag.eventos) || []).filter(e => e && e.fecha).map(e => `/evento/${encodeURIComponent(idEvento(e))}`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...paginas, ...ev].map(p => `  <url><loc>${origen}${p}</loc></url>`).join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
