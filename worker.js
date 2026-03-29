addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

const CLIENT_ID = 'neas-chp-webapp';
const TOKEN_URL = 'https://identity.neasenergy.com/auth/realms/neas/protocol/openid-connect/token';
const TARGET = 'https://api.neasenergy.com';

async function handleRequest(request) {
  // OPTIONS preflight - ALTID svar med CORS headers
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url = new URL(request.url);

  // /refresh-token endpoint
  if (url.pathname === '/refresh-token' && request.method === 'POST') {
    try {
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
      const data = await resp.text();
      return new Response(data, {
        status: resp.status,
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    } catch(e) {
      return new Response(JSON.stringify({error: e.message}), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }
  }

  // /v1/ proxy til Centrica
  if (url.pathname.startsWith('/v1/')) {
    try {
      const target = TARGET + url.pathname + url.search;
      const reqHeaders = new Headers();
      const auth = request.headers.get('Authorization');
      if (auth) reqHeaders.set('Authorization', auth);
      reqHeaders.set('Content-Type', 'application/json');
      const resp = await fetch(target, {
        method: request.method,
        headers: reqHeaders,
        body: request.method !== 'GET' ? request.body : undefined
      });
      const data = await resp.text();
      return new Response(data, {
        status: resp.status,
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    } catch(e) {
      return new Response(JSON.stringify({error: e.message}), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ok: true}), {
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}