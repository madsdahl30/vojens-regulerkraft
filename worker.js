// v4 - ES Modules
export default {
  async fetch(request, env, ctx) {
    const CORS = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "*"
    };
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: CORS });

    const url = new URL(request.url);

    if (url.pathname === "/refresh-token" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: body.refresh_token || ""
      });
      const resp = await fetch("https://api.neasenergy.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
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

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }
};