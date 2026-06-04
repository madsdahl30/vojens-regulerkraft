addEventListener("fetch", event => { event.respondWith(handleRequest(event.request)); });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "*" };

async function handleRequest(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const url = new URL(request.url);

  if (url.pathname === "/ping") {
    return new Response(JSON.stringify({pong: true, path: url.pathname, v: 16}), { headers: { ...CORS, "Content-Type": "application/json" } });
  }

  // EDS proxy: /eds/<dataset>?<params>  ->  https://api.energidataservice.dk/dataset/<dataset>?<params>
  if (url.pathname.startsWith("/eds/")) {
    try {
      const dataset = url.pathname.substring("/eds/".length);
      const target = "https://api.energidataservice.dk/dataset/" + dataset + url.search;
      const resp = await fetch(target, { method: "GET", headers: { "Accept": "application/json", "User-Agent": "vojens-proxy/16" } });
      const text = await resp.text();
      return new Response(text, { status: resp.status, headers: { ...CORS, "Content-Type": resp.headers.get("Content-Type") || "application/json", "X-Proxied-From": "energidataservice" } });
    } catch(e) {
      return new Response(JSON.stringify({error: e.message, source: "eds"}), { status: 502, headers: { ...CORS, "Content-Type": "application/json" } });
    }
  }

  if (url.pathname === "/refresh") {
    try {
      // Credentials are pulled from Cloudflare Worker Secrets:
      //   wrangler secret put NEAS_USERNAME
      //   wrangler secret put NEAS_PASSWORD
      // Fallback to old hardcoded values kept ONLY for transition — remove once secrets are set.
      const user = (typeof NEAS_USERNAME !== "undefined") ? NEAS_USERNAME : "ulrik@nykobbel.dk";
      const pass = (typeof NEAS_PASSWORD !== "undefined") ? NEAS_PASSWORD : "";
      if (!pass) return new Response(JSON.stringify({error: "NEAS_PASSWORD secret not set in Cloudflare Worker"}), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
      const body = "grant_type=password&client_id=neas-chp-webapp&username=" + encodeURIComponent(user) + "&password=" + encodeURIComponent(pass);
      const resp = await fetch("https://identity.neasenergy.com/auth/realms/neas/protocol/openid-connect/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body
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

  return new Response(JSON.stringify({ ok: true, v: 16 }), { headers: { ...CORS, "Content-Type": "application/json" } });
}
