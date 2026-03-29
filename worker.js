addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const TARGET = 'https://api.neasenergy.com';
const CLIENT_ID = 'neas-chp-webapp';
const TOKEN_URL = 'https://identity.neasenergy.com/auth/realms/neas/protocol/openid-connect/token';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  if (url.pathname === '/refresh-token' && request.method === 'POST') {
    const body = await request.json();
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      refresh_token: body.refresh_token || ''
    });
    const resp = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await resp.json();
    return new Response(JSON.stringify(data), { status: resp.status, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  if (url.pathname.startsWith('/v1/')) {
    const target = TARGET + url.pathname + url.search;
    const headers = new Headers(request.headers);
    headers.delete('Host'); headers.delete('Origin');
    const resp = await fetch(target, { method: request.method, headers, body: request.method !== 'GET' ? request.body : undefined });
    const rh = new Headers(resp.headers);
    Object.entries(CORS).forEach(([k,v]) => rh.set(k,v));
    return new Response(resp.body, { status: resp.status, headers: rh });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
}