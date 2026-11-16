// Inicio de sesión del panel (/admin) con GitHub. Paso 2: recoger el permiso y avisar al panel.
const pagina = (estado, contenido) => {
  const msg = `authorization:github:${estado}:${JSON.stringify(contenido)}`;
  return new Response(`<!doctype html><meta charset="utf-8"><title>Entrando…</title><p>Entrando en el panel…</p>
<script>
(() => {
  const msg = ${JSON.stringify(msg)};
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin) return;
    if (e.data === "authorizing:github") { window.opener && window.opener.postMessage(msg, e.origin); setTimeout(() => window.close(), 300); }
  });
  window.opener && window.opener.postMessage("authorizing:github", location.origin);
})();
</script>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Set-Cookie": "cms_state=; Path=/api; Max-Age=0" } });
};

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code"), state = url.searchParams.get("state");
  const cookie = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)cms_state=([^;]+)/);
  if (!code || !state || !cookie || cookie[1] !== state) return pagina("error", { message: "La sesión ha caducado o no es válida. Vuelve a intentarlo." });
  const r = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "costa-musical-cms" },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: `${url.origin}/api/callback` }),
  });
  const datos = await r.json().catch(() => ({}));
  if (!datos.access_token) return pagina("error", { message: datos.error_description || "GitHub no ha dado permiso." });
  return pagina("success", { provider: "github", token: datos.access_token });
}
