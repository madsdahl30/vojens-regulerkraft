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

async function getToken(params) {
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: params.toString()
  });
  return {data: await resp.text(), status: resp.status};
}

async function handleRequest(request) {
  if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:CORS});
  const url = new URL(request.url);

  if (url.pathname === '/refresh-token' && request.method === 'POST') {
    const body = await request.json().catch(()=>({}));
    const params = new URLSearchParams({grant_type:'refresh_token', client_id:CLIENT_ID, refresh_token: body.refresh_token||''});
    const {data, status} = await getToken(params);
    return new Response(data, {status, headers:{...CORS,'Content-Type':'application/json'}});
  }

  if (url.pathname === '/login' && request.method === 'POST') {
    const body = await request.json().catch(()=>({}));
    const params = new URLSearchParams({grant_type:'password', client_id:CLIENT_ID, username:body.username||'', password:body.password||''});
    const {data, status} = await getToken(params);
    return new Response(data, {status, headers:{...CORS,'Content-Type':'application/json'}});
  }

  if (url.pathname.startsWith('/v1/')) {
    const target = TARGET + url.pathname + url.search;
    const reqHeaders = new Headers();
    const auth = request.headers.get('Authorization');
    if (auth) reqHeaders.set('Authorization', auth);
    const resp = await fetch(target, {method:request.method, headers:reqHeaders, body: request.method!=='GET'?request.body:undefined});
    const data = await resp.text();
    return new Response(data, {status:resp.status, headers:{...CORS,'Content-Type':'application/json'}});
  }

  return new Response(JSON.stringify({ok:true}), {headers:{...CORS,'Content-Type':'application/json'}});
}