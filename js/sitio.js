/* Costa Musical · lógica común de la web.
   El contenido vive en /content/*.json y se edita desde el panel /admin.
   No hace falta tocar este archivo para cambiar textos, fechas o fotos. */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const parrafos = t => String(t || "").split(/\n\s*\n/).filter(Boolean).map(p => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  const slug = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  function idYoutube(url) {
    const m = String(url || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
    return m ? m[1] : (/^[\w-]{11}$/.test(url) ? url : "");
  }
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const pagina = document.body.dataset.pagina;

  function cargar(nombre) {
    return fetch(`content/${nombre}.json`, { cache: "no-cache" })
      .then(r => { if (!r.ok) throw new Error(nombre); return r.json(); });
  }

  /* Color de texto legible sobre un color de fondo */
  function tintaPara(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return "#12305a";
    const n = parseInt(m[1], 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return (.2126 * c[0] + .7152 * c[1] + .0722 * c[2]) > .35 ? "#12305a" : "#ffffff";
  }

  function fechaLocal(iso) {
    const [a, m, d] = String(iso).slice(0, 10).split("-").map(Number);
    return new Date(a, (m || 1) - 1, d || 1);
  }
  function etiquetaFecha(ev) {
    const f = fechaLocal(ev.fecha), anio = f.getFullYear(), mes = MESES[f.getMonth()];
    if (ev.fecha_texto) {
      const empiezaNum = /^\d/.test(ev.fecha_texto);
      return { grande: ev.fecha_texto, peq: empiezaNum ? `${mes} ${anio}` : String(anio) };
    }
    return { grande: String(f.getDate()), peq: `${mes} ${anio}` };
  }

  /* ---------- Cabecera y pie ---------- */
  function cabecera(aj) {
    const enlaces = [
      ["agrupacion.html#banda", "Agrupaciones", "agrupacion"],
      ["agenda.html", "Agenda", "agenda"],
      ["cursos.html", "Cursos", "cursos"],
      ["galeria.html", "Galería", "galeria"],
      ["unete.html", "Únete", "unete"],
      ["contrataciones.html", "Contrátanos", "contrataciones"],
      ["noticias.html", "Noticias", "noticias"],
    ];
    $("#cabecera").innerHTML = `
      <header class="cabecera"><div class="envoltorio">
        <a class="logo" href="index.html" aria-label="Costa Musical, inicio"><span class="logo-img" aria-hidden="true"></span><span class="logo-txt">COSTA<span>MUSICAL</span></span></a>
        <button class="boton-menu" id="boton-menu" aria-expanded="false" aria-controls="menu">Menú</button>
        <ul class="menu" id="menu">${enlaces.map(([h, t, p]) => `<li><a href="${h}"${p === pagina ? ' aria-current="page"' : ""}>${t}</a></li>`).join("")}</ul>
        <a class="boton marino peq enlace-ensembli" href="unete.html#socios" aria-label="Área de socios"><span class="socios-largo">Área de socios</span><span class="socios-corto" aria-hidden="true">Socios</span><span class="socios-txt" aria-hidden="true"> →</span></a>
      </div></header>`;
    const b = $("#boton-menu"), m = $("#menu");
    b.addEventListener("click", () => b.setAttribute("aria-expanded", m.classList.toggle("abierto")));
    // Más fina al bajar; en móvil se esconde al bajar y reaparece al subir
    const cab = $(".cabecera");
    let ultima = window.scrollY, pendiente = false;
    const alDesplazar = () => {
      pendiente = false;
      const y = Math.max(0, window.scrollY), dif = y - ultima;
      cab.classList.toggle("compacta", y > 40);
      if (m.classList.contains("abierto") || y < 120 || cab.contains(document.activeElement)) cab.classList.remove("oculta");
      else if (dif > 6) cab.classList.add("oculta");
      else if (dif < -6) cab.classList.remove("oculta");
      if (Math.abs(dif) > 6) ultima = y;
    };
    window.addEventListener("scroll", () => { if (!pendiente) { pendiente = true; requestAnimationFrame(alDesplazar); } }, { passive: true });
    cab.addEventListener("focusin", () => cab.classList.remove("oculta"));
    alDesplazar();
  }

  function redes(aj) {
    const sin = h => String(h || "").replace(/^@/, "");
    return [
      aj.instagram && ["Instagram", "https://www.instagram.com/" + encodeURIComponent(sin(aj.instagram)) + "/", aj.instagram],
      aj.tiktok && ["TikTok", "https://www.tiktok.com/@" + encodeURIComponent(sin(aj.tiktok)), aj.tiktok],
      aj.youtube && ["YouTube", "https://www.youtube.com/@" + encodeURIComponent(sin(aj.youtube)), aj.youtube],
      aj.facebook && ["Facebook", aj.facebook, "Facebook"]
    ].filter(Boolean);
  }

  function pie(aj, ens) {
    const tel = aj.telefono ? String(aj.telefono).replace(/[^\d+]/g, "") : "";
    const contacto = [aj.correo && `<li><a href="mailto:${esc(aj.correo)}">${esc(aj.correo)}</a></li>`,
      aj.telefono && `<li><a href="tel:${esc(tel)}">${esc(aj.telefono)}</a></li>`,
      ...redes(aj).map(([red, url, txt]) => `<li><a href="${esc(url)}" rel="noopener">${red}${red === "Facebook" ? "" : " " + esc(txt)}</a></li>`)].filter(Boolean).join("");
    $("#pie").innerHTML = `
      <footer class="pie"><div class="envoltorio">
        <div class="bloque"><b>COSTA MUSICAL</b><span>${esc(aj.nombre)}. Música en Punta Umbría (Huelva) desde 1996.</span></div>
        <div class="bloque"><b>AGRUPACIONES</b><ul>${ens.map(e => `<li><a href="agrupacion.html#${esc(e.id)}">${esc(e.nombre)}</a></li>`).join("")}</ul></div>
        <div class="bloque"><b>CONTACTO</b><ul>${contacto || "<li>Escríbenos desde <a href=\"unete.html#contacto\">el formulario</a></li>"}</ul></div>
        <p class="legal">© ${new Date().getFullYear()} ${esc(aj.nombre)}${aj.cif ? " · CIF " + esc(aj.cif) : ""} · <a href="unete.html#transparencia">Transparencia</a> · <a href="unete.html#privacidad">Privacidad y aviso legal</a></p>
      </div></footer>`;
  }

  function enlacesEnsembli(aj) {
    $$(".enlace-ensembli").forEach(a => {
      if (aj.ensembli_url) { a.href = aj.ensembli_url; a.target = "_blank"; a.rel = "noopener"; }
      else if (!a.closest(".cabecera")) {
        a.addEventListener("click", e => {
          e.preventDefault();
          const d = $("#aviso-ensembli");
          if (d) { try { d.showModal(); } catch (_) { d.setAttribute("open", ""); } }
        });
      }
    });
    const cerrar = $("#cerrar-aviso");
    if (cerrar) cerrar.addEventListener("click", () => $("#aviso-ensembli").close());
  }

  /* ---------- Agenda ---------- */
  function eventosEnsembli(aj) {
    if (!aj.ensembli_feed) return Promise.resolve([]);
    return fetch(aj.ensembli_feed).then(r => r.json()).then(d => {
      const lista = Array.isArray(d) ? d : (d.eventos || []);
      return lista.filter(e => e.publico !== false).map(e => ({
        titulo: e.titulo, fecha: String(e.inicio || e.fecha).slice(0, 10), hora: String(e.inicio || "").slice(11, 16),
        lugar: e.lugar || "", agrupacion: e.agrupacion || "", descripcion: e.descripcion || "", gratis: !!e.gratis, fecha_texto: "", desde_ensembli: true
      }));
    }).catch(() => []);
  }
  function proximos(eventos) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return eventos.filter(e => e.fecha && fechaLocal(e.fecha) >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
  /* ---------- Página de cada evento ---------- */
  function horaDe(ev) { const m = String(ev.hora || "").match(/(\d{1,2})[:.h](\d{2})/); return m ? [+m[1], +m[2]] : null; }
  function icsEvento(ev) {
    const f = fechaLocal(ev.fecha), p2 = n => String(n).padStart(2, "0"), dia = `${f.getFullYear()}${p2(f.getMonth() + 1)}${p2(f.getDate())}`;
    const h = horaDe(ev); let ini, fin;
    if (h) { const e = new Date(f); e.setHours(h[0] + 2, h[1]); ini = `DTSTART;TZID=Europe/Madrid:${dia}T${p2(h[0])}${p2(h[1])}00`; fin = `DTEND;TZID=Europe/Madrid:${e.getFullYear()}${p2(e.getMonth() + 1)}${p2(e.getDate())}T${p2(e.getHours())}${p2(e.getMinutes())}00`; }
    else { const e = new Date(f); e.setDate(e.getDate() + 1); ini = `DTSTART;VALUE=DATE:${dia}`; fin = `DTEND;VALUE=DATE:${e.getFullYear()}${p2(e.getMonth() + 1)}${p2(e.getDate())}`; }
    const t = x => String(x || "").replace(/[\\,;]/g, m => "\\" + m).replace(/\n/g, "\\n");
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Costa Musical//Web//ES", "BEGIN:VEVENT", `UID:${idEvento(ev)}@costamusical`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      ini, fin, `SUMMARY:${t(ev.titulo)}`, ev.lugar ? `LOCATION:${t(ev.lugar)}` : "", `DESCRIPTION:${t(ev.descripcion)}${ev.descripcion ? "\\n\\n" : ""}${location.href}`, "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
  }
  function pintarEvento(ev, d) {
    const e = d.porId[ev.agrupacion] || { corto: "Costa Musical", nombre: "Costa Musical" };
    const pasado = fechaLocal(ev.fecha) < hoy0();
    const album = ev.album && (d.albumes || []).find(a => a.id === ev.album);
    const yt = idYoutube(ev.video);
    const cuando = ev.fecha_texto ? `${ev.fecha_texto} · ${fechaLocal(ev.fecha).getFullYear()}` : fechaLarga(ev.fecha);
    const mapa = ev.mapa_url || (ev.lugar ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.lugar)}` : "");
    document.title = `${ev.titulo} · Agenda · Costa Musical`;
    $("#evento").innerHTML = `<a href="agenda.html" style="font-weight:700">← Toda la agenda</a>
      <div class="evento-rejilla">
        <div class="pila evento-info">
          <span class="quien-evento">${esc(e.nombre || e.corto)}${pasado ? " · Ya celebrado" : ""}</span>
          <h1 class="titulo-xl" style="font-size:clamp(40px,6.5vw,76px)">${esc(ev.titulo)}</h1>
          ${ev.descripcion ? `<p class="entradilla">${esc(ev.descripcion)}</p>` : ""}
          <dl class="ficha-datos">
            <div><dt>Cuándo</dt><dd>${esc(cuando)}${ev.hora ? `<br>${esc(ev.hora)}` : ""}</dd></div>
            ${ev.lugar ? `<div><dt>Dónde</dt><dd>${esc(ev.lugar)}${mapa ? `<br><a href="${esc(mapa)}" target="_blank" rel="noopener">Cómo llegar →</a>` : ""}</dd></div>` : ""}
            <div><dt>Entrada</dt><dd>${ev.gratis ? "Libre hasta completar aforo" : esc(ev.precio || "Consultar")}</dd></div>
          </dl>
          <div class="acciones">
            ${ev.entradas_url && !pasado ? `<a class="boton amarillo" href="${esc(ev.entradas_url)}" target="_blank" rel="noopener">Comprar entradas</a>` : ""}
            ${!pasado ? `<button type="button" class="boton blanco" id="ev-calendario">Añadir a mi calendario</button>` : ""}
            <button type="button" class="boton blanco" id="ev-compartir">Compartir</button>
            ${album ? `<a class="boton marino" href="galeria.html#${esc(album.id)}">Ver fotos</a>` : ""}
          </div>
          <p class="aviso" id="ev-aviso" role="status" hidden></p>
          ${ev.texto ? `<div class="texto pila">${parrafos(ev.texto)}</div>` : ""}
          ${(ev.programa || []).length ? `<h2 class="titulo" style="font-size:clamp(28px,4vw,40px)">Programa</h2>
            <ol class="programa-lista">${ev.programa.map(o => `<li><b>${esc(o.obra)}</b>${o.autor ? `<span>${esc(o.autor)}</span>` : ""}</li>`).join("")}</ol>` : ""}
          ${yt ? `<h2 class="titulo" style="font-size:clamp(28px,4vw,40px)">${pasado ? "Vídeo" : "Adelanto"}</h2>
            <div class="video"><button type="button" class="video-lite" data-yt="${esc(yt)}" style="background-image:url('https://i.ytimg.com/vi/${esc(yt)}/hqdefault.jpg')" aria-label="Reproducir: ${esc(ev.titulo)}"><span class="play" aria-hidden="true">▶</span></button></div>` : ""}
        </div>
        ${ev.cartel ? `<aside class="evento-cartel"><a href="${esc(encodeURI(ev.cartel))}" target="_blank" rel="noopener"><img src="${esc(encodeURI(ev.cartel))}" alt="Cartel: ${esc(ev.titulo)}"></a><p class="suave">Pulsa para verlo en grande</p></aside>` : ""}
      </div>`;
    const aviso = $("#ev-aviso");
    const cal = $("#ev-calendario");
    if (cal) cal.addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([icsEvento(ev)], { type: "text/calendar" }));
      a.download = `${slug(ev.titulo) || "evento"}.ics`; document.body.appendChild(a); a.click(); a.remove();
    });
    $("#ev-compartir").addEventListener("click", async () => {
      const datos = { title: ev.titulo, text: `${ev.titulo} · ${cuando}${ev.lugar ? " · " + ev.lugar : ""}`, url: location.href };
      try {
        if (navigator.share) { await navigator.share(datos); return; }
        await navigator.clipboard.writeText(location.href); aviso.hidden = false; aviso.textContent = "Enlace copiado. Pégalo donde quieras.";
      } catch (_) { /* cancelado */ }
    });
    const v = $("#evento .video-lite");
    if (v) v.addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1`; f.title = ev.titulo;
      f.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"; f.allowFullscreen = true; v.replaceWith(f);
    });
  }
  /* ---------- Cursos: fechas y estado automático ---------- */
  const MESES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function hoy0() { const h = new Date(); h.setHours(0, 0, 0, 0); return h; }
  function encuentrosDe(c) {
    return (c.encuentros || []).filter(e => e && e.fecha).map(e => {
      const ini = fechaLocal(e.fecha), fin = e.fecha_fin ? fechaLocal(e.fecha_fin) : ini;
      return { ...e, ini, fin: fin < ini ? ini : fin };
    }).sort((a, b) => a.ini - b.ini);
  }
  function rangoFechas(e) {
    const a = e.ini, b = e.fin, d = x => `${x.getDate()} de ${MESES_L[x.getMonth()]}`;
    if (a.getTime() === b.getTime()) return `${d(a)} de ${a.getFullYear()}`;
    if (a.getFullYear() !== b.getFullYear()) return `${d(a)} de ${a.getFullYear()} al ${d(b)} de ${b.getFullYear()}`;
    if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} de ${MESES_L[a.getMonth()]} de ${a.getFullYear()}`;
    return `${d(a)} al ${d(b)} de ${a.getFullYear()}`;
  }
  function resumenFechas(c) {
    const e = encuentrosDe(c);
    if (!e.length) return c.fechas || "";
    if (e.length === 1) return rangoFechas(e[0]);
    const a = e[0].ini, b = e[e.length - 1].fin;
    const m = x => `${MESES_L[x.getMonth()]}${a.getFullYear() !== b.getFullYear() ? " de " + x.getFullYear() : ""}`;
    return `${e.length} encuentros, de ${m(a)} a ${m(b)}${a.getFullYear() === b.getFullYear() ? " de " + b.getFullYear() : ""}`;
  }
  function estadoCurso(c) {
    const e = encuentrosDe(c), h = hoy0();
    const terminado = e.length > 0 && e.every(x => x.fin < h);
    const hayPasado = e.some(x => x.fin < h), proximo = e.find(x => x.fin >= h);
    const insc = c.inscripcion || (c.inscripcion_abierta ? "abierta" : "proximamente");
    const plazoCerrado = !!c.fecha_limite && fechaLocal(c.fecha_limite) < h;
    let clase, texto;
    if (terminado) { clase = "finalizado"; texto = "Edición finalizada"; }
    else if (insc === "completa") { clase = "completo"; texto = "Plazas agotadas"; }
    else if (insc === "abierta" && plazoCerrado) { clase = "cerrado"; texto = hayPasado ? "En curso" : "Inscripción cerrada"; }
    else if (insc === "abierta") { clase = "abierto"; texto = "Inscripción abierta"; }
    else { clase = "proximamente"; texto = hayPasado ? "En curso" : "Próximamente"; }
    return { clase, texto, abierta: clase === "abierto", proximo, hayPasado };
  }
  // Los encuentros futuros de los cursos aparecen también en la agenda
  function eventosCursos(cursos) {
    const lista = [];
    (cursos || []).forEach(c => encuentrosDe(c).forEach((e, i, todos) => lista.push({
      fecha: e.fecha, titulo: e.titulo ? `${c.titulo}: ${e.titulo}` : (todos.length > 1 ? `${c.titulo} (encuentro ${i + 1})` : c.titulo),
      hora: [e.fecha_fin && e.fecha_fin !== e.fecha ? "Hasta el " + rangoFechas({ ini: e.fin, fin: e.fin }) : "", e.horario].filter(Boolean).join(" · "),
      lugar: e.lugar || c.lugar, quien: "Curso", enlace: `cursos.html#${c.id}`, agrupacion: ""
    })));
    return lista;
  }
  const idEvento = ev => ev.id || `${ev.fecha}-${slug(ev.titulo)}`;
  function tarjetaEvento(ev, porId) {
    const e = porId[ev.agrupacion] || { corto: "Costa Musical", color: "#ffcc29" };
    const f = etiquetaFecha(ev);
    const detalles = [ev.hora, ev.lugar].filter(Boolean).join(" · ");
    return `<li class="entrada" style="--c:${esc(e.color)};--t:${tintaPara(e.color)}">
      <div class="dia"><b>${esc(f.grande)}</b><span>${esc(f.peq)}</span></div>
      <div class="info"><span class="quien">${esc(ev.quien || e.corto)}${ev.gratis ? " · Entrada libre" : ""}</span><h3>${ev.enlace ? esc(ev.titulo) : `<a class="enlace-evento" href="agenda.html#${esc(idEvento(ev))}">${esc(ev.titulo)}</a>`}</h3>
      ${ev.descripcion ? `<p>${esc(ev.descripcion)}</p>` : ""}${detalles ? `<p><b>${esc(detalles)}</b></p>` : ""}${ev.precio ? `<p><b>${esc(ev.precio)}</b></p>` : ""}
      ${ev.entradas_url ? `<p><a class="boton amarillo peq" href="${esc(ev.entradas_url)}" rel="noopener" target="_blank">Comprar entradas</a></p>` : ""}
      ${ev.enlace ? `<p><a class="boton marino peq" href="${esc(ev.enlace)}">Ver curso</a></p>` : `<p><a class="mas-info" href="agenda.html#${esc(idEvento(ev))}">Más información →</a></p>`}
      ${(ev.programa || []).length ? `<details class="programa"><summary>Ver programa</summary><ol>${ev.programa.map(o => `<li><b>${esc(o.obra)}</b>${o.autor ? `<span>${esc(o.autor)}</span>` : ""}</li>`).join("")}</ol></details>` : ""}</div></li>`;
  }
  function pintarEventos(destino, lista, porId, vacio) {
    destino.innerHTML = lista.length ? lista.map(ev => tarjetaEvento(ev, porId)).join("")
      : `<li class="vacio" style="grid-column:1/-1">${esc(vacio)}</li>`;
  }

  /* ---------- Formularios (Netlify Forms) ---------- */
  function prepararFormularios(aj) {
    $$("form[data-netlify]").forEach(form => {
      form.addEventListener("submit", ev => {
        ev.preventDefault();
        const aviso = $(".aviso", form);
        const priv = $('input[name="privacidad"]', form);
        if (priv && !priv.checked) { aviso.hidden = false; aviso.textContent = "Marca la casilla de privacidad para poder enviarlo."; return; }
        const obligatorio = $$("[required]", form).find(i => !i.value.trim());
        if (obligatorio) { obligatorio.focus(); aviso.hidden = false; aviso.textContent = "Rellena los campos marcados como obligatorios."; return; }
        const fd = new FormData(form);
        if (fd.get("bot-field")) return; // trampa para robots
        const asuntos = { "ensayo-prueba": "Ensayo de prueba", presupuesto: "Petición de presupuesto", contacto: "Contacto", "inscripcion-curso": "Inscripción a curso" };
        let envio;
        if (aj.formularios_clave) {
          // Envío por correo con Web3Forms (clave pública en Ajustes del panel)
          fd.append("access_key", aj.formularios_clave);
          fd.append("subject", `Web Costa Musical · ${asuntos[fd.get("form-name")] || "Formulario"}${fd.get("curso") ? " · " + fd.get("curso") : ""}`);
          fd.append("from_name", "Web Costa Musical");
          ["form-name", "bot-field", "privacidad"].forEach(k => fd.delete(k));
          envio = fetch("https://api.web3forms.com/submit", { method: "POST", headers: { Accept: "application/json" }, body: fd })
            .then(r => r.json()).then(j => { if (!j.success) throw new Error(); });
        } else {
          envio = fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fd).toString() })
            .then(r => { if (!r.ok) throw new Error(); });
        }
        envio
          .then(() => {
            const pago = form.dataset.pago, curso = form.curso && form.curso.value;
            form.reset(); if (form.curso) form.curso.value = curso; aviso.hidden = false;
            if (pago) { aviso.innerHTML = `¡Inscripción recibida! Para reservar tu plaza, completa el pago: <a class="boton amarillo peq" href="${esc(pago)}" target="_blank" rel="noopener">Pagar inscripción</a>`; }
            else aviso.textContent = "¡Recibido! Te contestamos lo antes posible.";
          })
          .catch(() => {
            const texto = [...new FormData(form)].filter(([k]) => !["form-name", "bot-field", "privacidad"].includes(k)).map(([k, v]) => `${k}: ${v}`).join("\n");
            aviso.hidden = false;
            aviso.textContent = `No hemos podido enviarlo desde aquí. ${aj.correo ? "Escríbenos a " + aj.correo + " con este texto:" : "Copia este texto y envíanoslo por nuestras redes:"}\n\n${texto}`;
          });
      });
    });
  }

  /* ---------- Páginas ---------- */
  const paginas = {
    inicio(d) {
      const { inicio: ini, porId, ens, eventos, noticias } = d;
      $("#titular").innerHTML = `${esc(ini.titular)}<br><span>${esc(ini.titular_destacado)}</span>`;
      $("#entradilla").textContent = ini.entradilla;
      $("#cinta").innerHTML = (ini.cinta || []).map((c, i) => {
        const t = typeof c === "string" ? c : c.texto, h = typeof c === "string" ? `galeria.html#categoria-${slug(c)}` : (c.enlace || "#");
        return (i ? "<span aria-hidden=\"true\">·</span>" : "") + `<a href="${esc(h)}">${esc(t)}</a>`;
      }).join("");
      const alb = (d.albumes || []).slice().sort((a, b) => String(b.fecha).localeCompare(a.fecha)).slice(0, 4);
      if (alb.length && $("#galeria-inicio")) { $("#bloque-galeria").hidden = false; $("#galeria-inicio").innerHTML = alb.map(tarjetaAlbum).join(""); }
      const foto = $("#foto-portada");
      const diapos = (ini.carrusel || []).filter(x => x.imagen);
      if (!diapos.length && ini.foto_portada) diapos.push({ imagen: ini.foto_portada, pie: ini.pie_foto || "" });
      if (diapos.length) carrusel(foto, diapos);
      const t = ini.testimonio || {};
      if (t.texto) $("#cita").innerHTML = `<p>«${esc(t.texto)}»</p><footer>${esc([t.nombre, t.instrumento].filter(Boolean).join(", "))}${t.desde ? ", en la banda desde " + esc(t.desde) : ""}</footer>`;
      $("#rejilla-ens").innerHTML = ens.map(e => `
        <a class="ficha-ens${e.estado === "proyecto" ? " proyecto" : ""}" href="agrupacion.html#${esc(e.id)}" style="${e.estado === "proyecto" ? "" : `background:${esc(e.color)};color:${tintaPara(e.color)}`}">
          <span class="etq">${esc(e.estado === "proyecto" ? "Próximamente" : e.etiqueta).toUpperCase()}</span><span class="nombre">${esc(e.corto)}</span></a>`).join("");
      pintarEventos($("#agenda-inicio"), proximos(eventos).slice(0, 3), porId, "Pronto anunciaremos nuevos conciertos.");
      const n = (noticias || []).slice().sort((a, b) => String(b.fecha).localeCompare(a.fecha)).slice(0, 3);
      if (n.length) { $("#bloque-noticias").hidden = false; $("#lista-noticias").innerHTML = n.map(tarjetaNoticia).join(""); }
      $("#colaboradores").innerHTML = (ini.colaboradores || []).map(c => `<div><b>${esc(c.nombre)}</b><span class="suave">${esc(c.detalle)}</span></div>`).join("") +
        `<div class="hueco"><b>Tu empresa aquí</b><a href="unete.html#contacto">Patrocina una agrupación</a></div>`;
    },

    agrupacion(d) {
      const { ens, porId, eventos } = d;
      function pintar() {
        const id = location.hash.slice(1);
        const e = porId[id] || ens[0];
        document.title = `${e.nombre} · Costa Musical`;
        $("#chips-ens").innerHTML = ens.map(x => `<a href="#${esc(x.id)}" class="${x.estado === "proyecto" ? "proyecto" : ""}"${x.id === e.id ? ' aria-current="page"' : ""}>${esc(x.corto)}</a>`).join("");
        const cab = $("#cab-ens"); cab.style.background = e.color; cab.style.color = tintaPara(e.color);
        $("#ens-nombre").textContent = e.estado === "proyecto" ? e.nombre : "La " + e.corto;
        $("#ens-subtitulo").textContent = e.estado === "proyecto" ? "En preparación" : e.nombre;
        $("#ens-lema").textContent = e.lema;
        $("#ens-acciones").innerHTML = e.estado === "proyecto"
          ? `<a class="boton marino" href="unete.html">Quiero participar</a>`
          : `<a class="boton marino" href="contrataciones.html">Contratar</a><a class="boton blanco" href="unete.html">Toca con nosotros</a>`;
        $("#ens-ficha").innerHTML = [["Formación", e.formacion], ["Dirección", e.direccion], ["Repertorio", e.repertorio], ["Ensayos", e.ensayos]]
          .filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
        $("#ens-cifras").innerHTML = (e.cifras || []).map(c => `<div class="cifra"><b>${esc(c.valor)}</b><span>${esc(c.texto)}</span></div>`).join("");
        $("#ens-cifras").hidden = !(e.cifras || []).length;
        $("#ens-texto").innerHTML = parrafos(e.descripcion);
        const dir = e.directores || [];
        $("#ens-directores").hidden = !dir.length;
        $("#ens-directores ul").innerHTML = dir.map(x => `<li><b>${esc(x.periodo)}</b> · ${esc(x.nombre)}</li>`).join("");
        const foto = $("#ens-foto");
        foto.hidden = !e.foto; if (e.foto) foto.style.backgroundImage = `url("${encodeURI(e.foto)}")`;
        const hist = e.historia || [];
        $("#ens-historia").hidden = !hist.length;
        $("#ens-historia ol").innerHTML = hist.map(h => `<li><b>${esc(h.anio)}</b>${esc(h.texto)}</li>`).join("");
        $("#ens-buscamos").innerHTML = (e.buscamos || []).map(b => `<span>${esc(b)}</span>`).join("");
        pintarEventos($("#ens-agenda"), proximos(eventos).filter(x => x.agrupacion === e.id).slice(0, 6), porId,
          e.estado === "proyecto" ? "Todavía se está formando. ¡Apúntate y estrénala con nosotros!" : "Próximas actuaciones por anunciar. ¡Atento a Instagram!");
        window.scrollTo(0, 0);
      }
      window.addEventListener("hashchange", pintar);
      pintar();
    },

    agenda(d) {
      const { ens, porId, eventos } = d;
      const lista = proximos(eventos);
      const hoy = hoy0();
      const anteriores = eventos.filter(e => e.fecha && !e.enlace && fechaLocal(e.fecha) < hoy).sort((a, b) => b.fecha.localeCompare(a.fecha));
      const usadas = ens.filter(e => e.estado !== "proyecto");
      let filtro = "todas";
      function pintarLista() {
        $("#filtros").innerHTML = [["todas", "Todo"], ...usadas.map(e => [e.id, e.corto])]
          .map(([id, t]) => `<button type="button" class="filtro" data-f="${esc(id)}" aria-pressed="${filtro === id}">${esc(t)}</button>`).join("");
        const f = e => filtro === "todas" || e.agrupacion === filtro;
        pintarEventos($("#agenda-completa"), lista.filter(f), porId, "Próximas actuaciones por anunciar. ¡Atento a Instagram!");
        const ant = anteriores.filter(f).slice(0, 12);
        $("#bloque-anteriores").hidden = !ant.length;
        $("#agenda-anteriores").innerHTML = ant.map(ev => tarjetaEvento(ev, porId)).join("");
      }
      function pintar() {
        const h = decodeURIComponent(location.hash.slice(1));
        const ev = eventos.find(e => !e.enlace && idEvento(e) === h);
        $("#vista-agenda").hidden = !!ev; $("#cab-agenda").hidden = !!ev; $("#evento").hidden = !ev;
        if (ev) { pintarEvento(ev, d); window.scrollTo(0, 0); return; }
        document.title = "Agenda · Costa Musical";
        if (porId[h]) filtro = h;
        pintarLista();
      }
      $("#filtros").addEventListener("click", ev => { const b = ev.target.closest("[data-f]"); if (b) { filtro = b.dataset.f; pintarLista(); } });
      window.addEventListener("hashchange", pintar);
      pintar();
    },

    unete(d) {
      const { ens } = d;
      const mapa = {};
      ens.forEach(e => (e.buscamos || []).forEach(i => { (mapa[i] = mapa[i] || []).push(e.corto); }));
      const instrumentos = Object.keys(mapa);
      let actual = instrumentos.includes("Trompeta") ? "Trompeta" : instrumentos[0];
      $("#f-agrupacion").innerHTML = ens.map(e => `<option>${esc(e.corto)}</option>`).join("") + "<option>Aún no lo sé</option>";
      function pintar() {
        $("#instrumentos").innerHTML = instrumentos.map(i => `<button type="button" class="filtro" data-i="${esc(i)}" aria-pressed="${i === actual}">${esc(i)}</button>`).join("");
        $("#actual").textContent = actual;
        $("#destinos").innerHTML = mapa[actual].map(x => `<span>${esc(x)}</span>`).join("");
        $("#f-instrumento").value = actual;
        $("#f-agrupacion").value = mapa[actual][0];
      }
      $("#instrumentos").addEventListener("click", ev => { const b = ev.target.closest("[data-i]"); if (b) { actual = b.dataset.i; pintar(); } });
      pintar();
    },

    contrataciones(d) {
      const { ens, actos } = d;
      let actual = actos[0] && actos[0].nombre;
      $("#servicios").innerHTML = ens.map(e => `<div class="caja${e.estado === "proyecto" ? " cielo" : ""}" style="border-top:10px solid ${esc(e.color)}"><h3>${esc(e.corto)}</h3><p>${esc(e.servicio)}</p></div>`).join("");
      function pintar() {
        const a = actos.find(x => x.nombre === actual) || actos[0];
        $("#actos").innerHTML = actos.map(x => `<button type="button" class="filtro" data-a="${esc(x.nombre)}" aria-pressed="${x.nombre === a.nombre}">${esc(x.nombre)}</button>`).join("");
        $("#reco").textContent = a.recomendacion;
        $("#porque").textContent = a.explicacion;
        $("#f-tipo").value = a.nombre;
        $("#f-formacion").value = a.recomendacion;
      }
      $("#actos").addEventListener("click", ev => { const b = ev.target.closest("[data-a]"); if (b) { actual = b.dataset.a; pintar(); } });
      if (actos.length) pintar();
    },

    asociacion(d) {
      const aj = d.ajustes;
      const cuota = String(aj.cuota_socio ?? "").trim();
      $("#cuota").textContent = /^0+([.,]0+)?$/.test(cuota) ? "Hacerse socio o socia es gratis." : cuota ? `Cuota anual: ${cuota} €` : "Escríbenos y te contamos la cuota de este año.";
      const datos = [["Correo", aj.correo && `<a href="mailto:${esc(aj.correo)}">${esc(aj.correo)}</a>`], ["Teléfono", aj.telefono && `<a href="tel:${esc(String(aj.telefono).replace(/[^\d+]/g, ""))}">${esc(aj.telefono)}</a>`],
        ...redes(aj).map(([red, url, txt]) => [red, `<a href="${esc(url)}" rel="noopener">${esc(red === "Facebook" ? "Ver página" : txt)}</a>`]),
        ["Ensayos", esc(aj.lugar_ensayos)]].filter(([, v]) => v);
      $("#datos-contacto").innerHTML = datos.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
      $$(".d-cif").forEach(n => n.textContent = aj.cif ? `CIF ${aj.cif}` : "");
      $$(".d-correo").forEach(n => n.textContent = aj.correo || "nuestro correo");
    },

    cursos(d) {
      const cursos = d.cursos || [];
      const form = $("#form-inscripcion"), hueco = $("#hueco-form");
      const ord = c => { const e = encuentrosDe(c), p = e.find(x => x.fin >= hoy0()); return p ? p.ini.getTime() : Infinity; };
      const ultimo = c => { const e = encuentrosDe(c); return e.length ? Math.max(...e.map(x => x.fin.getTime())) : 0; };
      const tarjeta = c => { const st = estadoCurso(c); return `
            <a class="noticia" href="#${esc(c.id)}">
              <div class="img${c.foto ? "" : " sin-foto-curso"}" style="${c.foto ? `background-image:url('${esc(encodeURI(c.foto))}')` : ""}"></div>
              <div class="cuerpo"><span class="estado-curso ${st.clase}">${esc(st.texto)}</span><h3>${esc(c.titulo)}</h3>
              <p class="suave">${esc([c.tipo, resumenFechas(c)].filter(Boolean).join(" · "))}</p>
              ${st.proximo && st.hayPasado ? `<p class="suave"><b>Próximo encuentro: ${esc(rangoFechas(st.proximo))}</b></p>` : ""}
              <p>${esc(c.resumen || "")}</p></div></a>`; };
      function pintar() {
        const c = cursos.find(x => x.id === location.hash.slice(1));
        $("#lista-cursos").hidden = !!c; $("#curso").hidden = !c;
        if (c) {
          document.title = `${c.titulo} · Cursos · Costa Musical`;
          const st = estadoCurso(c), enc = encuentrosDe(c), profes = (c.profesorado || []).filter(p => p && p.nombre);
          let esp = (c.especialidades || []).filter(Boolean);
          if (!esp.length) esp = [...new Set(profes.map(p => (p.especialidad || "").trim()).filter(Boolean))];
          const conEsp = n => { const p = profes.find(x => x.nombre.trim().toLowerCase() === String(n).trim().toLowerCase()); return p ? (p.especialidad ? `${p.nombre} (${p.especialidad.toLowerCase()})` : p.nombre) : n; };
          const profesDe = e => (e.profesores || []).filter(Boolean);
          const datos = [["Fechas", resumenFechas(c)], ["Lugar", c.lugar], ["Dirigido a", c.dirigido], [esp.length > 1 ? "Especialidades" : "Especialidad", esp.join(", ")],
            ["Precio", c.precio], ["Plazas", c.plazas], ["Inscripción hasta", st.abierta && c.fecha_limite ? rangoFechas({ ini: fechaLocal(c.fecha_limite), fin: fechaLocal(c.fecha_limite) }) : ""]].filter(([, v]) => v);
          $("#curso-info").innerHTML = `<a href="cursos.html" style="font-weight:700">← Todos los cursos</a>
            <span class="estado-curso ${st.clase}">${esc(st.texto)}</span>
            <h1 class="titulo-xl" style="font-size:clamp(40px,7vw,80px)">${esc(c.titulo)}</h1>
            ${c.foto ? `<img class="foto-curso" src="${esc(encodeURI(c.foto))}" alt="">` : ""}
            ${datos.length ? `<dl class="ficha-datos">${datos.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
            <div class="pila">${parrafos(c.descripcion)}</div>
            ${enc.length > 1 || (enc.length === 1 && (enc[0].titulo || enc[0].horario || enc[0].cartel || profesDe(enc[0]).length)) ? `<h2 class="titulo" style="font-size:clamp(28px,4vw,40px)">${enc.length > 1 ? "Encuentros" : "Fecha"}</h2>
            <ol class="encuentros">${enc.map((e, i) => { const pas = e.fin < hoy0(), prox = !!st.proximo && e.fecha === st.proximo.fecha;
              return `<li class="${pas ? "pasado" : ""}${prox ? " proximo" : ""}"><div class="enc-fecha">${esc(rangoFechas(e))}</div>
                <div><b>${esc(e.titulo || (enc.length > 1 ? `Encuentro ${i + 1}` : c.titulo))}</b>${pas ? ' <span class="enc-marca">Celebrado</span>' : prox ? ' <span class="enc-marca prox">Próximo</span>' : ""}
                ${[e.horario, e.lugar].filter(Boolean).length ? `<p class="suave">${esc([e.horario, e.lugar].filter(Boolean).join(" · "))}</p>` : ""}
                ${profesDe(e).length ? `<p class="enc-profes">Con ${esc(profesDe(e).map(conEsp).join(" y "))}</p>` : ""}</div>
                ${e.cartel ? `<a class="enc-cartel" href="${esc(encodeURI(e.cartel))}" target="_blank" rel="noopener" aria-label="Ver cartel de ${esc(e.titulo || "este encuentro")}"><img src="${esc(encodeURI(e.cartel))}" alt="" loading="lazy"><span>Ver cartel</span></a>` : ""}</li>`; }).join("")}</ol>` : ""}
            ${profes.length ? `<h2 class="titulo" style="font-size:clamp(28px,4vw,40px)">Profesorado</h2><div class="rejilla profes">${profes.map(p => `<div class="caja profe">${p.foto ? `<img src="${esc(encodeURI(p.foto))}" alt="" loading="lazy">` : ""}<div>${p.especialidad ? `<span class="etq-esp">${esc(p.especialidad)}</span>` : ""}<h3>${esc(p.nombre)}</h3><p>${esc(p.descripcion || "")}</p></div></div>`).join("")}</div>` : ""}`;
          if (st.abierta) {
            form.hidden = false; form.curso.value = c.titulo; form.dataset.pago = c.enlace_pago || ""; hueco.hidden = false; $("#cerrado").hidden = true;
            // Especialidad: desplegable si hay varias, fija si hay una, texto libre si no hay
            const lab = $("#l-instrumento");
            if (esp.length > 1) lab.innerHTML = `Especialidad *<select id="i-instrumento" name="especialidad" required><option value="">Elige…</option>${esp.map(x => `<option>${esc(x)}</option>`).join("")}</select>`;
            else if (esp.length === 1) lab.innerHTML = `Especialidad<input id="i-instrumento" name="especialidad" value="${esc(esp[0])}" readonly>`;
            else lab.innerHTML = `Instrumento<input id="i-instrumento" name="instrumento">`;
            // Encuentros sueltos
            const fs = $("#i-encuentros"), futuros = enc.filter(e => e.fin >= hoy0()), oculto = $('input[name="encuentros"]', fs);
            if (c.encuentros_sueltos && futuros.length > 1) {
              fs.hidden = false;
              $("div", fs).innerHTML = futuros.map(e => { const t = [rangoFechas(e), e.titulo, profesDe(e).join(" y ")].filter(Boolean).join(" · ");
                return `<label class="check"><input type="checkbox" value="${esc(t)}" checked> <span>${esc(t)}</span></label>`; }).join("");
              const sync = () => { oculto.value = $$('input[type="checkbox"]', fs).filter(x => x.checked).map(x => x.value).join(" | "); oculto.required = true; };
              $$('input[type="checkbox"]', fs).forEach(x => x.addEventListener("change", sync)); sync();
            } else { fs.hidden = true; oculto.value = ""; oculto.required = false; }
          } else {
            form.hidden = true; hueco.hidden = true; $("#cerrado").hidden = false;
            const txt = st.clase === "finalizado" ? ["Esta edición ya ha terminado. Escríbenos y te avisamos cuando abramos la próxima.", "Avisadme de la próxima"]
              : st.clase === "completo" ? ["Las plazas están agotadas. Escríbenos y te apuntamos a la lista de espera.", "Lista de espera"]
              : st.clase === "cerrado" ? ["El plazo de inscripción ya se ha cerrado. Escríbenos si tienes alguna duda.", "Escribirnos"]
              : ["La inscripción de este curso aún no está abierta. Escríbenos y te avisamos en cuanto se abra.", "Avisadme"];
            $("#cerrado-txt").textContent = txt[0]; $("#cerrado-btn").textContent = txt[1];
          }
        } else {
          document.title = "Cursos · Costa Musical";
          const activos = cursos.filter(c => estadoCurso(c).clase !== "finalizado").sort((a, b) => ord(a) - ord(b));
          const pasados = cursos.filter(c => estadoCurso(c).clase === "finalizado").sort((a, b) => ultimo(b) - ultimo(a));
          $("#cursos").innerHTML = activos.length ? activos.map(tarjeta).join("") : `<p class="vacio">Pronto publicaremos nuestros próximos cursos.</p>`;
          $("#bloque-pasados").hidden = !pasados.length;
          $("#cursos-pasados").innerHTML = pasados.map(tarjeta).join("");
        }
        window.scrollTo(0, 0);
      }
      window.addEventListener("hashchange", pintar);
      pintar();
    },

    galeria(d) {
      const albumes = (d.albumes || []).slice().sort((a, b) => String(b.fecha).localeCompare(a.fecha));
      const cats = [...new Set(albumes.map(a => a.categoria).filter(Boolean))];
      const canal = d.ajustes.youtube ? "https://www.youtube.com/@" + encodeURIComponent(String(d.ajustes.youtube).replace(/^@/, "")) : "";
      if (canal) { $("#canal-youtube").hidden = false; $("#canal-youtube a").href = canal; }
      let fotosVisor = [], iVisor = 0;
      const visor = $("#visor");
      function verFoto(i) {
        iVisor = (i + fotosVisor.length) % fotosVisor.length;
        const f = fotosVisor[iVisor];
        $("#visor img").src = encodeURI(f.imagen); $("#visor img").alt = f.pie || "";
        $("#visor-pie").textContent = (f.pie ? f.pie + " · " : "") + `${iVisor + 1} de ${fotosVisor.length}`;
      }
      $("#visor-cerrar").addEventListener("click", () => visor.close());
      $("#visor-ant").addEventListener("click", () => verFoto(iVisor - 1));
      $("#visor-sig").addEventListener("click", () => verFoto(iVisor + 1));
      visor.addEventListener("keydown", e => { if (e.key === "ArrowLeft") verFoto(iVisor - 1); if (e.key === "ArrowRight") verFoto(iVisor + 1); });
      visor.addEventListener("click", e => { if (e.target === visor) visor.close(); });

      function pintar() {
        const h = location.hash.slice(1);
        const album = albumes.find(a => a.id === h);
        $("#lista-albumes").hidden = !!album; $("#album").hidden = !album;
        if (album) {
          document.title = `${album.titulo} · Galería · Costa Musical`;
          fotosVisor = album.fotos || [];
          const vids = (album.videos || []).map(v => ({ ...v, id: idYoutube(v.url) })).filter(v => v.id);
          $("#album").innerHTML = `<a href="galeria.html" style="font-weight:700">← Toda la galería</a>
            <p class="etq-album">${esc(album.categoria || "")}${album.fecha ? " · " + String(album.fecha).slice(0, 4) : ""}</p>
            <h1 class="titulo">${esc(album.titulo)}</h1>
            ${album.descripcion ? `<p class="entradilla">${esc(album.descripcion)}</p>` : ""}
            ${vids.length ? `<div class="videos">${vids.map(v => `<div class="video"><button type="button" class="video-lite" data-yt="${esc(v.id)}" style="background-image:url('https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg')" aria-label="Reproducir: ${esc(v.titulo || "vídeo")}"><span class="play" aria-hidden="true">▶</span></button>${v.titulo ? `<p>${esc(v.titulo)}</p>` : ""}</div>`).join("")}</div>` : ""}
            ${fotosVisor.length ? `<div class="fotos">${fotosVisor.map((f, i) => `<button type="button" class="miniatura" data-i="${i}" aria-label="Ampliar foto ${i + 1}${f.pie ? ": " + esc(f.pie) : ""}"><img src="${esc(encodeURI(f.imagen))}" alt="${esc(f.pie || "")}" loading="lazy"></button>`).join("")}</div>` : ""}`;
          $$("#album .miniatura").forEach(b => b.addEventListener("click", () => { verFoto(+b.dataset.i); try { visor.showModal(); } catch (_) { visor.setAttribute("open", ""); } }));
          $$("#album .video-lite").forEach(b => b.addEventListener("click", () => {
            const f = document.createElement("iframe");
            f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1`;
            f.title = b.getAttribute("aria-label").replace("Reproducir: ", "");
            f.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"; f.allowFullscreen = true;
            b.replaceWith(f);
          }));
        } else {
          document.title = "Galería · Costa Musical";
          const filtro = h.startsWith("categoria-") ? h.slice(10) : "todas";
          $("#filtros-galeria").innerHTML = [["todas", "Todo"], ...cats.map(c => [slug(c), c])]
            .map(([id, t]) => `<a class="filtro" href="${id === "todas" ? "galeria.html" : "#categoria-" + id}" aria-pressed="${filtro === id}">${esc(t)}</a>`).join("");
          const lista = albumes.filter(a => filtro === "todas" || slug(a.categoria) === filtro);
          $("#albumes").innerHTML = lista.length ? lista.map(tarjetaAlbum).join("")
            : `<p class="vacio" style="grid-column:1/-1">Todavía no hay fotos ni vídeos en esta sección. ¡Pronto subiremos más!</p>`;
        }
        window.scrollTo(0, 0);
      }
      window.addEventListener("hashchange", pintar);
      pintar();
    },

    noticias(d) {
      const lista = (d.noticias || []).slice().sort((a, b) => String(b.fecha).localeCompare(a.fecha));
      function pintar() {
        const n = lista.find(x => x.id === location.hash.slice(1));
        $("#lista").hidden = !!n; $("#articulo").hidden = !n;
        if (n) {
          document.title = `${n.titulo} · Costa Musical`;
          $("#articulo").innerHTML = `<a href="noticias.html" style="font-weight:700">← Todas las noticias</a>
            <time datetime="${esc(n.fecha)}" style="font-weight:700;color:var(--azul)">${fechaLarga(n.fecha)}</time>
            <h1 class="titulo">${esc(n.titulo)}</h1>
            ${n.foto ? `<img src="${esc(n.foto)}" alt="" style="border:var(--borde) solid var(--marino);border-radius:var(--radio)">` : ""}
            <div class="texto">${parrafos(n.texto)}</div>`;
        } else {
          document.title = "Noticias · Costa Musical";
          $("#lista-noticias").innerHTML = lista.length ? lista.map(tarjetaNoticia).join("") : `<p class="vacio">Todavía no hay noticias.</p>`;
        }
        window.scrollTo(0, 0);
      }
      window.addEventListener("hashchange", pintar);
      pintar();
    }
  };

  function fechaLarga(iso) {
    const f = fechaLocal(iso);
    return `${f.getDate()} de ${["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][f.getMonth()]} de ${f.getFullYear()}`;
  }
  function carrusel(caja, diapos) {
    caja.classList.remove("sin-foto"); caja.classList.add("carrusel");
    caja.removeAttribute("role"); caja.setAttribute("aria-roledescription", "carrusel"); caja.setAttribute("aria-label", "Fotos de la banda");
    caja.innerHTML = diapos.map((d, i) => `<figure class="diapo${i ? "" : " activa"}" aria-hidden="${i ? "true" : "false"}"><img src="${esc(encodeURI(d.imagen))}" alt="${esc(d.pie || "")}" ${i ? 'loading="lazy"' : ""}>${d.pie ? `<figcaption>${esc(d.pie)}</figcaption>` : ""}</figure>`).join("") +
      (diapos.length > 1 ? `<button type="button" class="carr-btn ant" aria-label="Foto anterior">‹</button><button type="button" class="carr-btn sig" aria-label="Foto siguiente">›</button>
      <div class="carr-puntos">${diapos.map((_, i) => `<button type="button" aria-label="Ver foto ${i + 1}"${i ? "" : ' aria-current="true"'}></button>`).join("")}</div>` : "");
    if (diapos.length < 2) return;
    const figs = $$(".diapo", caja), puntos = $$(".carr-puntos button", caja);
    let i = 0, temp = null;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function ir(n) {
      figs[i].classList.remove("activa"); figs[i].setAttribute("aria-hidden", "true"); puntos[i].removeAttribute("aria-current");
      i = (n + figs.length) % figs.length;
      figs[i].classList.add("activa"); figs[i].setAttribute("aria-hidden", "false"); puntos[i].setAttribute("aria-current", "true");
    }
    function auto() { clearInterval(temp); if (!quieto) temp = setInterval(() => ir(i + 1), 6000); }
    $(".ant", caja).addEventListener("click", () => { ir(i - 1); auto(); });
    $(".sig", caja).addEventListener("click", () => { ir(i + 1); auto(); });
    puntos.forEach((p, n) => p.addEventListener("click", () => { ir(n); auto(); }));
    caja.addEventListener("mouseenter", () => clearInterval(temp));
    caja.addEventListener("mouseleave", auto);
    caja.addEventListener("focusin", () => clearInterval(temp));
    let x0 = null;
    caja.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    caja.addEventListener("touchend", e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { ir(i + (dx < 0 ? 1 : -1)); auto(); } x0 = null; });
    auto();
  }

  function tarjetaAlbum(a) {
    const portada = a.portada || (a.fotos && a.fotos[0] && a.fotos[0].imagen) || "";
    const nf = (a.fotos || []).length, nv = (a.videos || []).filter(v => idYoutube(v.url)).length;
    const yt = !portada && nv ? idYoutube(a.videos.find(v => idYoutube(v.url)).url) : "";
    const fondo = portada ? `background-image:url('${esc(encodeURI(portada))}')` : yt ? `background-image:url('https://i.ytimg.com/vi/${yt}/hqdefault.jpg')` : "";
    return `<a class="noticia" href="galeria.html#${esc(a.id)}">
      <div class="img" style="${fondo}"></div>
      <div class="cuerpo"><span class="etq-album">${esc(a.categoria || "")}${a.fecha ? " · " + String(a.fecha).slice(0, 4) : ""}</span><h3>${esc(a.titulo)}</h3>
      <p class="suave">${[nf && `${nf} foto${nf > 1 ? "s" : ""}`, nv && `${nv} vídeo${nv > 1 ? "s" : ""}`].filter(Boolean).join(" · ")}</p></div></a>`;
  }
  function tarjetaNoticia(n) {
    return `<a class="noticia" href="noticias.html#${esc(n.id)}">
      <div class="img" style="${n.foto ? `background-image:url('${esc(n.foto)}')` : ""}"></div>
      <div class="cuerpo"><time datetime="${esc(n.fecha)}">${fechaLarga(n.fecha)}</time><h3>${esc(n.titulo)}</h3><p class="suave">${esc(n.resumen)}</p></div></a>`;
  }

  /* ---------- Arranque ---------- */
  Promise.all(["ajustes", "agrupaciones", "agenda", "inicio", "noticias", "contrataciones", "galeria", "cursos"].map(n => cargar(n).catch(() => ({}))))
    .then(([ajustes, agr, agenda, inicio, not, contr, gal, cur]) => {
      const ens = agr.agrupaciones || [];
      const porId = Object.fromEntries(ens.map(e => [e.id, e]));
      cabecera(ajustes); pie(ajustes, ens); enlacesEnsembli(ajustes); prepararFormularios(ajustes);
      return eventosEnsembli(ajustes).then(extra => {
        const datos = { ajustes, ens, porId, inicio, eventos: [...(agenda.eventos || []), ...extra, ...eventosCursos(cur.cursos)], noticias: not.noticias || [], actos: contr.actos || [], albumes: gal.albumes || [], cursos: cur.cursos || [] };
        if (paginas[pagina]) paginas[pagina](datos);
        if (pagina === "unete") paginas.asociacion(datos);
      });
    });
})();
