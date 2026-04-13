addEventListener("fetch", event => { event.respondWith(handleRequest(event.request)); });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "*" };
async function handleRequest(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const url = new URL(request.url);
  if (url.pathname === "/ping") {
    return new Response(JSON.stringify({pong: true, path: url.pathname}), { headers: { ...CORS, "Content-Type": "application/json" } });
  }
  if (url.pathname === "/refresh") {
    try {
      const resp = await fetch("https://identity.neasenergy.com/auth/realms/neas/protocol/openid-connect/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=password&client_id=neas-chp-webapp&username=ulrik%40nykobbel.dk&password=Qwerty123"
      });
      const text = await resp.text();
      return new Response(text, { status: resp.status, headers: { ...CORS, "Content-Type": "application/json" } });
    } catch(e) {
      return new Response(JSON.stringify({error: e.message, stack: e.stack}), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }
  }
  if (url.pathname.startsWith("/v1/") || url.pathname.startsWith("/BidApi/")) {
    try {
      const headers = new Headers(request.headers);
      headers.delete("origin"); headers.delete("referer");
      const resp = await fetch("https://api.neasenergy.com" + url.pathname + url.search, {
        method: request.method, headers: headers,
        body: request.method !== "GET" ? request.body : undefined
      });
      return new Response(await resp.text(), { status: resp.status, headers: { ...CORS, "Content-Type": resp.headers.get("Content-Type") || "application/json" } });
    } catch(e) {
      return new Response(JSON.stringify({error: e.message}), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }
  }
  return new Response(JSON.stringify({ ok: true, v: 15 }), { headers: { ...CORS, "Content-Type": "application/json" } });
}