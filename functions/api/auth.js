// Inicio de sesión del panel (/admin) con GitHub. Paso 1: enviar a GitHub.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.GITHUB_CLIENT_ID) return new Response("Falta GITHUB_CLIENT_ID en Cloudflare", { status: 500 });
  const state = crypto.randomUUID().replace(/-/g, "");
  const gh = new URL("https://github.com/login/oauth/authorize");
  gh.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  gh.searchParams.set("scope", url.searchParams.get("scope") || "repo,user");
  gh.searchParams.set("state", state);
  gh.searchParams.set("redirect_uri", `${url.origin}/api/callback`);
  return new Response(null, {
    status: 302,
    headers: {
      Location: gh.toString(),
      "Set-Cookie": `cms_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
