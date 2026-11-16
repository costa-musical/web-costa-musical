/* Costa Musical · lógica común de la web.
   El contenido vive en /content/*.json y se edita desde el panel /admin.
   No hace falta tocar este archivo para cambiar textos, fechas o fotos. */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const parrafos = t => String(t || "").split(/\n\s*\n/).filter(Boolean).map(p => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
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
      ["unete.html", "Únete", "unete"],
      ["contrataciones.html", "Contrátanos", "contrataciones"],
      ["noticias.html", "Noticias", "noticias"],
      ["asociacion.html", "Asociación", "asociacion"]
    ];
    $("#cabecera").innerHTML = `
      <header class="cabecera"><div class="envoltorio">
        <a class="logo" href="index.html" aria-label="Costa Musical, inicio">COSTA<span>MUSICAL</span></a>
        <button class="boton-menu" id="boton-menu" aria-expanded="false" aria-controls="menu">Menú</button>
        <ul class="menu" id="menu">${enlaces.map(([h, t, p]) => `<li><a href="${h}"${p === pagina ? ' aria-current="page"' : ""}>${t}</a></li>`).join("")}</ul>
        <a class="boton marino peq enlace-ensembli" href="asociacion.html#socios">Área de socios<span class="socios-txt" aria-hidden="true"> →</span></a>
      </div></header>`;
    const b = $("#boton-menu"), m = $("#menu");
    b.addEventListener("click", () => b.setAttribute("aria-expanded", m.classList.toggle("abierto")));
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
        <div class="bloque"><b>CONTACTO</b><ul>${contacto || "<li>Escríbenos desde <a href=\"asociacion.html#contacto\">el formulario</a></li>"}</ul></div>
        <p class="legal">© ${new Date().getFullYear()} ${esc(aj.nombre)}${aj.cif ? " · CIF " + esc(aj.cif) : ""} · <a href="asociacion.html#transparencia">Transparencia</a> · <a href="asociacion.html#privacidad">Privacidad y aviso legal</a></p>
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
  function tarjetaEvento(ev, porId) {
    const e = porId[ev.agrupacion] || { corto: "Costa Musical", color: "#ffcc29" };
    const f = etiquetaFecha(ev);
    const detalles = [ev.hora, ev.lugar].filter(Boolean).join(" · ");
    return `<li class="entrada" style="--c:${esc(e.color)};--t:${tintaPara(e.color)}">
      <div class="dia"><b>${esc(f.grande)}</b><span>${esc(f.peq)}</span></div>
      <div class="info"><span class="quien">${esc(e.corto)}${ev.gratis ? " · Entrada libre" : ""}</span><h3>${esc(ev.titulo)}</h3>
      ${ev.descripcion ? `<p>${esc(ev.descripcion)}</p>` : ""}${detalles ? `<p><b>${esc(detalles)}</b></p>` : ""}
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
        const datos = new URLSearchParams(new FormData(form));
        fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: datos.toString() })
          .then(r => {
            if (!r.ok) throw new Error();
            form.reset(); aviso.hidden = false; aviso.textContent = "¡Recibido! Te contestamos lo antes posible.";
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
      $("#cinta").innerHTML = (ini.cinta || []).map((t, i) => (i ? "<span aria-hidden=\"true\">·</span>" : "") + `<span>${esc(t)}</span>`).join("");
      const foto = $("#foto-portada");
      if (ini.foto_portada) { foto.style.backgroundImage = `url("${ini.foto_portada}")`; foto.textContent = ""; foto.setAttribute("aria-label", ini.pie_foto || "Foto de la banda"); }
      const t = ini.testimonio || {};
      if (t.texto) $("#cita").innerHTML = `<p>«${esc(t.texto)}»</p><footer>${esc([t.nombre, t.instrumento].filter(Boolean).join(", "))}${t.desde ? ", en la banda desde " + esc(t.desde) : ""}</footer>`;
      $("#rejilla-ens").innerHTML = ens.map(e => `
        <a class="ficha-ens${e.estado === "proyecto" ? " proyecto" : ""}" href="agrupacion.html#${esc(e.id)}" style="${e.estado === "proyecto" ? "" : `background:${esc(e.color)};color:${tintaPara(e.color)}`}">
          <span class="etq">${esc(e.estado === "proyecto" ? "Próximamente" : e.etiqueta).toUpperCase()}</span><span class="nombre">${esc(e.corto)}</span></a>`).join("");
      pintarEventos($("#agenda-inicio"), proximos(eventos).slice(0, 3), porId, "Pronto anunciaremos nuevos conciertos.");
      const n = (noticias || []).slice().sort((a, b) => String(b.fecha).localeCompare(a.fecha)).slice(0, 3);
      if (n.length) { $("#bloque-noticias").hidden = false; $("#lista-noticias").innerHTML = n.map(tarjetaNoticia).join(""); }
      $("#colaboradores").innerHTML = (ini.colaboradores || []).map(c => `<div><b>${esc(c.nombre)}</b><span class="suave">${esc(c.detalle)}</span></div>`).join("") +
        `<div class="hueco"><b>Tu empresa aquí</b><a href="asociacion.html#contacto">Patrocina una agrupación</a></div>`;
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
        foto.hidden = !e.foto; if (e.foto) foto.style.backgroundImage = `url("${e.foto}")`;
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
      const usadas = ens.filter(e => e.estado !== "proyecto");
      let filtro = porId[location.hash.slice(1)] ? location.hash.slice(1) : "todas";
      function pintar() {
        $("#filtros").innerHTML = [["todas", "Todo"], ...usadas.map(e => [e.id, e.corto])]
          .map(([id, t]) => `<button type="button" class="filtro" data-f="${esc(id)}" aria-pressed="${filtro === id}">${esc(t)}</button>`).join("");
        pintarEventos($("#agenda-completa"), lista.filter(e => filtro === "todas" || e.agrupacion === filtro), porId, "Próximas actuaciones por anunciar. ¡Atento a Instagram!");
      }
      $("#filtros").addEventListener("click", ev => { const b = ev.target.closest("[data-f]"); if (b) { filtro = b.dataset.f; pintar(); } });
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
  function tarjetaNoticia(n) {
    return `<a class="noticia" href="noticias.html#${esc(n.id)}">
      <div class="img" style="${n.foto ? `background-image:url('${esc(n.foto)}')` : ""}"></div>
      <div class="cuerpo"><time datetime="${esc(n.fecha)}">${fechaLarga(n.fecha)}</time><h3>${esc(n.titulo)}</h3><p class="suave">${esc(n.resumen)}</p></div></a>`;
  }

  /* ---------- Arranque ---------- */
  Promise.all(["ajustes", "agrupaciones", "agenda", "inicio", "noticias", "contrataciones"].map(n => cargar(n).catch(() => ({}))))
    .then(([ajustes, agr, agenda, inicio, not, contr]) => {
      const ens = agr.agrupaciones || [];
      const porId = Object.fromEntries(ens.map(e => [e.id, e]));
      cabecera(ajustes); pie(ajustes, ens); enlacesEnsembli(ajustes); prepararFormularios(ajustes);
      return eventosEnsembli(ajustes).then(extra => {
        const datos = { ajustes, ens, porId, inicio, eventos: [...(agenda.eventos || []), ...extra], noticias: not.noticias || [], actos: contr.actos || [] };
        if (paginas[pagina]) paginas[pagina](datos);
      });
    });
})();
