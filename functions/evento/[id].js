// /evento/<id>: la página del evento con vista previa al compartir (WhatsApp, Facebook…) y datos para Google
import { idEvento, esc, json, hora, desfaseMadrid, fechaTexto } from "../_comun.js";

export async function onRequestGet(ctx) {
  const id = decodeURIComponent(ctx.params.id || "");
  const origen = new URL(ctx.request.url).origin;
  const [ag, ens, aj] = await Promise.all([json(ctx, "/content/agenda.json"), json(ctx, "/content/agrupaciones.json"), json(ctx, "/content/ajustes.json")]);
  const ev = ((ag && ag.eventos) || []).find(e => e && e.fecha && idEvento(e) === id);
  const pagina = await ctx.env.ASSETS.fetch(new URL("/agenda.html", ctx.request.url));
  if (!ev) return new Response(null, { status: 302, headers: { Location: "/agenda.html" } });

  const agr = ((ens && ens.agrupaciones) || []).find(a => a.id === ev.agrupacion);
  const quien = (agr && agr.nombre) || "Costa Musical";
  const abs = u => u ? new URL(encodeURI(u), origen).href : "";
  const imagen = abs(ev.cartel) || `${origen}/img/compartir.jpg`;
  const cuando = fechaTexto(ev) + (ev.hora ? ` · ${ev.hora}` : "");
  const desc = [cuando, ev.lugar, ev.gratis ? "Entrada libre" : ev.precio].filter(Boolean).join(" · ") + (ev.descripcion ? `. ${ev.descripcion}` : "");
  const url = `${origen}/evento/${encodeURIComponent(id)}`;

  // Datos estructurados (schema.org/Event) para que Google pueda mostrarlo como evento
  const [a, m, d] = String(ev.fecha).slice(0, 10).split("-").map(Number);
  const h = hora(ev), p2 = n => String(n).padStart(2, "0");
  const inicio = h ? `${ev.fecha.slice(0, 10)}T${p2(h[0])}:${p2(h[1])}:00${desfaseMadrid(a, m, d)}` : ev.fecha.slice(0, 10);
  const ld = {
    "@context": "https://schema.org", "@type": "Event", name: ev.titulo, startDate: inicio,
    eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: ev.lugar || "Punta Umbría", address: { "@type": "PostalAddress", streetAddress: ev.lugar || "", addressLocality: "Punta Umbría", addressRegion: "Huelva", addressCountry: "ES" } },
    image: [imagen], description: ev.descripcion || desc, url,
    organizer: { "@type": "Organization", name: "Asociación Cultural Costa Musical", url: origen, ...(aj && aj.correo ? { email: aj.correo } : {}) },
    performer: { "@type": "MusicGroup", name: quien }
  };
  if (ev.gratis || ev.precio || ev.entradas_url) {
    const precio = ev.gratis ? 0 : (parseFloat(String(ev.precio || "").replace(",", ".").match(/[\d.]+/)?.[0]) || undefined);
    ld.offers = { "@type": "Offer", url: ev.entradas_url || url, priceCurrency: "EUR", availability: "https://schema.org/InStock", ...(precio !== undefined ? { price: precio } : {}) };
  }

  const meta = `
<base href="/">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Costa Musical">
<meta property="og:locale" content="es_ES">
<meta property="og:title" content="${esc(ev.titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(imagen)}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;

  return new HTMLRewriter()
    .on("title", { element(e) { e.setInnerContent(`${ev.titulo} · ${quien} · Costa Musical`); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute("content", desc); } })
    .on('meta[property^="og:"],meta[name="twitter:card"]', { element(e) { e.remove(); } })
    .on("head", { element(e) { e.prepend(meta, { html: true }); } })
    .on("body", { element(e) { e.setAttribute("data-evento", id); } })
    .transform(new Response(pagina.body, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" } }));
}
