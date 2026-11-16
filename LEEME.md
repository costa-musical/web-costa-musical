# Web de Costa Musical

Web de la Asociación Cultural Costa Musical (Banda de Música de Punta Umbría y agrupaciones), estilo «Verbena con traje».

- **Es una web estática:** HTML, CSS y JavaScript, sin base de datos ni servidor.
- **Todo el contenido está en `content/`:** agenda, noticias, agrupaciones, textos de portada y datos de contacto, en archivos JSON.
- **Se edita desde un panel en `/admin`:** con formularios, sin tocar código.

## Qué hay en cada carpeta

| Carpeta / archivo | Para qué sirve | ¿Se toca a mano? |
|---|---|---|
| `content/*.json` | Todo el contenido de la web | No: se edita desde el panel `/admin` |
| `img/subidas/` | Fotos subidas desde el panel | No: el panel las guarda aquí |
| `admin/` | Panel de edición (Sveltia CMS) | Solo `config.yml`, una vez |
| `css/estilo.css` | Diseño | Solo si cambiáis el diseño |
| `js/sitio.js` | Lógica: pinta la agenda, buscadores, formularios | Solo si cambiáis cómo funciona |
| `*.html` | Estructura de cada página | Rara vez |

## Puesta en marcha (una sola vez, ~30 minutos)

1. **Crea un repositorio en GitHub** (por ejemplo `web-costa-musical`) y sube todos estos archivos.
2. **`admin/config.yml`** ya apunta a `costa-musical/web-costa-musical`.
3. **Publica la web en Netlify.**
   - Entra con tu cuenta de GitHub, elige «Add new site → Import an existing project» y selecciona el repositorio.
   - No hace falta comando de compilación. La carpeta de publicación es la raíz (`/`).
4. **Activa el inicio de sesión con GitHub para el panel.** En Netlify, ve a *Site configuration → Access & security → OAuth* (o similar), en «Authentication providers», y añade GitHub. Sveltia CMS usa ese proveedor sin más cambios en `config.yml`.
5. **Activa los formularios.**
   - Netlify detecta solos los tres formularios de la web: `ensayo-prueba`, `presupuesto` y `contacto`.
   - En *Forms → Form notifications*, añade una notificación por correo al email de la asociación para que os lleguen las solicitudes.
   - Revisad el cupo gratuito de formularios de vuestro plan.
6. **Dominio (opcional).** Si compráis uno (por ejemplo `costamusical.es`), se conecta en *Domain management*.
7. **Da acceso a los editores.**
   - Cada persona que vaya a editar necesita una cuenta gratuita de GitHub.
   - Invítala como colaboradora del repositorio (*Settings → Collaborators*).
   - Después entra en `https://tu-web/admin` y pulsa «Iniciar sesión con GitHub».

> Alternativa sin Netlify: la web funciona igual en Cloudflare Pages o GitHub Pages. En ese caso, para el inicio de sesión del panel hay que desplegar el autenticador `sveltia-cms-auth` en Cloudflare Workers y añadir `base_url` en `config.yml`. También se puede entrar con un token personal de GitHub. Los formularios tendrían que ir a otro servicio, porque Netlify Forms solo funciona en Netlify.

## Uso diario del panel (para editores)

Entra en `/admin`. Verás estas secciones:

- **Agenda:** añade un concierto con «Añadir evento».
  - Si aún no sabes el día exacto, pon el día 1 del mes y escribe «Nov» en *Texto de fecha*.
  - Los eventos pasados desaparecen solos de la web.
- **Noticias:** título, fecha, foto, resumen y texto. Deja una línea en blanco entre párrafos.
- **Página de inicio:** la foto grande, la frase de un músico y los colaboradores.
- **Agrupaciones:** textos, foto, director, historia e instrumentos que se buscan de cada agrupación.
  - El buscador «¿Qué tocas?» se construye solo con esas listas.
  - Escribid cada instrumento igual en todas las agrupaciones (por ejemplo, siempre «Saxofón»).
- **Contrataciones:** los tipos de acto y la formación que recomienda el selector.
- **Ajustes y contacto:** correo, teléfono, Instagram, CIF, cuota de socio y los dos enlaces de Ensembli.

Al pulsar **Guardar**, el cambio se publica en la web en uno o dos minutos.

## Conexión con Ensembli

En *Ajustes y contacto* hay dos campos:

- **Dirección del área de socios:** la URL de Ensembli. El botón «Área de socios» lleva allí.
- **Enlace del calendario público (JSON):** si lo rellenas, la agenda añade sola los eventos públicos de Ensembli.
  - A partir de ese momento, poned los conciertos solo en Ensembli para no duplicarlos.
  - El formato que espera la web está en `ENSEMBLI-FEED.md`.

## Probar la web en tu ordenador

Como la web lee los archivos JSON, hay que abrirla con un pequeño servidor, no con doble clic:

```
cd web-costa-musical
python3 -m http.server 8000
```

Y abre `http://localhost:8000`.
