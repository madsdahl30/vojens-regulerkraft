// v6 - api.neasenergy.com token endpoint
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

    if (url.pathname === "/refresh-token") {
      const rt = url.searchParams.get("rt") || "";
      if (!rt) return new Response(JSON.stringify({error:"no rt"}), {status:400, headers:{...CORS,"Content-Type":"application/json"}});
      const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: rt
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

    return new Response(JSON.stringify({ ok: true, v: 6 }), {
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }
};