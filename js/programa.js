/* Programa de mano (díptico A5) a partir de los datos del evento */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const idEvento = ev => ev.id || `${ev.fecha}-${slug(ev.titulo)}`;
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const fecha = iso => { const [a, m, d] = iso.slice(0, 10).split("-").map(Number); return new Date(a, m - 1, d); };
  const fechaLarga = ev => { const f = fecha(ev.fecha); const t = ev.fecha_texto ? `${ev.fecha_texto} de ${f.getFullYear()}` : `${DIAS[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}`; return t.charAt(0).toUpperCase() + t.slice(1); };
  const corta = ev => { const f = fecha(ev.fecha); return `${f.getDate()} ${MESES[f.getMonth()].slice(0, 3)}`; };
  const parrafos = t => String(t || "").split(/\n+/).map(x => x.trim()).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join("");
  const cargar = n => fetch(`content/${n}.json`, { cache: "no-cache" }).then(r => r.ok ? r.json() : {}).catch(() => ({}));
  const qr = texto => { const q = qrcode(0, "M"); q.addData(texto); q.make(); return q.createDataURL(8, 2); };

  Promise.all(["agenda", "agrupaciones", "ajustes", "inicio"].map(cargar)).then(([ag, ens, aj, ini]) => {
    const id = decodeURIComponent(location.hash.slice(1));
    const eventos = (ag.eventos || []).filter(e => e && e.fecha);
    const ev = eventos.find(e => idEvento(e) === id);
    if (!ev) { $("#folleto").innerHTML = `<p class="cargando">No se ha encontrado el concierto. Vuelve a la agenda y pulsa «Programa de mano» en su página.</p>`; return; }
    const agr = (ens.agrupaciones || []).find(a => a.id === ev.agrupacion) || {};
    const dirActual = (agr.directores || []).find(d => /hoy|actual/i.test(d.periodo || ""));
    const director = ev.director || (dirActual && dirActual.nombre) || "";
    const url = `${location.origin}/evento/${encodeURIComponent(idEvento(ev))}`;
    const apoyos = [...(ev.apoyos || []), ...((ini.colaboradores || []).filter(c => c && c.logo))].filter((c, i, t) => c && c.nombre && t.findIndex(x => x.nombre === c.nombre) === i);
    const hoy = fecha(ev.fecha);
    const proximos = eventos.filter(e => fecha(e.fecha) > hoy && e !== ev).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 4);
    const redes = [aj.instagram && `Instagram ${aj.instagram}`, aj.tiktok && `TikTok ${aj.tiktok}`, aj.youtube && `YouTube ${aj.youtube}`].filter(Boolean).join(" · ");
    document.title = `Programa de mano · ${ev.titulo} · Costa Musical`;
    $("#volver").href = `/evento/${encodeURIComponent(idEvento(ev))}`;

    const portada = ev.cartel
      ? `<section class="panel portada"><span class="fondo" style="background-image:url('${esc(encodeURI(ev.cartel))}')"></span><img class="cartel" src="${esc(encodeURI(ev.cartel))}" alt=""></section>`
      : `<section class="panel portada sin-cartel"><div><span class="p-agr">${esc(agr.nombre || "Costa Musical")}</span><h1>${esc(ev.titulo)}</h1></div><span class="lira" style="width:30mm;height:40mm;color:var(--oro);opacity:.9"></span><div class="p-fecha"><b>${esc(fechaLarga(ev))}</b>${esc([ev.hora, ev.lugar].filter(Boolean).join(" · "))}</div></section>`;

    const contra = `<section class="panel contra">
      <div class="marca"><span class="lira"></span><b>COSTAMUSICAL</b><span>Asociación Cultural Costa Musical · Punta Umbría</span></div>
      ${proximos.length ? `<div class="prox"><h3>Próximas citas</h3><ul>${proximos.map(e => `<li><b>${esc(corta(e))}</b><span>${esc(e.titulo)}${e.lugar ? " · " + esc(e.lugar.split(",")[0]) : ""}</span></li>`).join("")}</ul></div>` : ""}
      <div class="qr"><img src="${qr(url)}" alt=""><div><b>Toda la información en la web</b><span>${esc(location.host)}<br>Agenda, fotos, cursos y cómo unirte.</span></div></div>
      ${apoyos.length ? `<div><h3>Con el apoyo de</h3><div class="apoyos">${apoyos.map(c => c.logo ? `<img src="${esc(encodeURI(c.logo))}" alt="${esc(c.nombre)}">` : `<b>${esc(c.nombre)}</b>`).join("")}</div></div>` : ""}
      ${redes ? `<p class="redes">${esc(redes)}</p>` : ""}
    </section>`;

    const ficha = [["Dirección", director], ["Solistas", ev.solistas], ["Fecha", `${fechaLarga(ev)}${ev.hora ? " · " + ev.hora : ""}`], ["Lugar", ev.lugar]].filter(([, v]) => v);
    const izq = `<section class="panel interior">
      <span class="etq">${esc(agr.nombre || "Costa Musical")}</span>
      <h2>${esc(ev.titulo)}</h2>
      <div class="texto">${parrafos(ev.texto_folleto || ev.texto || ev.descripcion)}</div>
      <dl class="ficha">${ficha.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
    </section>`;
    const obras = (ev.programa || []).filter(o => o && o.obra);
    const der = `<section class="panel interior">
      <h2>Programa</h2>
      <div class="programa-caja"><ol class="programa">${obras.map(o => /^\s*(—|-{2,}|descanso|primera parte|segunda parte|parte)/i.test(o.obra) && !o.autor
        ? `<li class="parte">${esc(o.obra.replace(/^[\s—-]+|[\s—-]+$/g, ""))}</li>`
        : `<li><b>${esc(o.obra)}</b>${o.autor ? `<span>${esc(o.autor)}</span>` : ""}</li>`).join("")}</ol></div>
      ${ev.agradecimientos ? `<p class="agradece">${esc(ev.agradecimientos)}</p>` : ""}
      <div class="pie-int"><span class="lira"></span>Gracias por acompañarnos. Por favor, silencia tu móvil durante el concierto.</div>
    </section>`;

    $("#folleto").innerHTML = `<p class="cara-etq no-imprimir">Cara exterior (contraportada · portada)</p><div class="hoja">${contra}${portada}</div>
      <p class="cara-etq no-imprimir">Cara interior</p><div class="hoja">${izq}${der}</div>`;
  });
  document.getElementById("imprimir").addEventListener("click", () => window.print());
})();
