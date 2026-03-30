addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

const TOKEN_URL = 'https://api.neasenergy.com/token';
const TARGET = 'https://api.neasenergy.com';

async function handleRequest(request) {
  if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:CORS});
  const url = new URL(request.url);

  // /refresh-token - fornyer token via Centrica API
  if (url.pathname === '/refresh-token' && request.method === 'POST') {
    const body = await request.json().catch(()=>({}));
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: body.refresh_token || ''
    });
    const resp = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: params.toString()
    });
    const data = await resp.text();
    return new Response(data, {status: resp.status, headers: {...CORS, 'Content-Type': resp.headers.get('Content-Type')||'application/json'}});
  }

  // /v1/ proxy - videresend som-det-er
  if (url.pathname.startsWith('/v1/')) {
    const target = TARGET + url.pathname + url.search;
    const reqHeaders = new Headers();
    const auth = request.headers.get('Authorization');
    if (auth) reqHeaders.set('Authorization', auth);
    const resp = await fetch(target, {method: request.method, headers: reqHeaders, body: request.method !== 'GET' ? request.body : undefined});
    const rh = new Headers(resp.headers);
    Object.entries(CORS).forEach(([k,v]) => rh.set(k,v));
    return new Response(resp.body, {status: resp.status, headers: rh});
  }

  return new Response(JSON.stringify({ok:true}), {headers:{...CORS,'Content-Type':'application/json'}});
}