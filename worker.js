// v11 - GET /refresh med X-RT header
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "*,X-RT"
};

async function handleRequest(request) {
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: CORS });

  const url = new URL(request.url);

  if (url.pathname === "/refresh") {
    const rt = request.headers.get("X-RT") || "";
    if (!rt) return new Response(JSON.stringify({error:"no rt"}), {status:400, headers:{...CORS,"Content-Type":"application/json"}});
    const resp = await fetch("https://identity.neasenergy.com/auth/realms/neas/protocol/openid-connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=refresh_token&client_id=neas-chp-webapp&refresh_token=" + encodeURIComponent(rt)
    });
    return new Response(await resp.text(), {
      status: resp.status,
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }

  if (url.pathname.startsWith("/v1/") || url.pathname.startsWith("/BidApi/")) {
    const headers = new Headers(request.headers);
    headers.delete("origin");
    headers.delete("referer");
    const resp = await fetch("https://api.neasenergy.com" + url.pathname + url.search, {
      method: request.method,
      headers: headers,
      body: request.method !== "GET" ? request.body : undefined
    });
    return new Response(await resp.text(), {
      status: resp.status,
      headers: { ...CORS, "Content-Type": resp.headers.get("Content-Type") || "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true, v: 11 }), {
    headers: { ...CORS, "Content-Type": "application/json" }
  });
}