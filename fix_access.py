import urllib.request, json, os, sys

token = os.environ['CF_TOKEN']
account = os.environ['CF_ACCOUNT']
headers = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}

# List Access apps
req = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/accounts/{account}/access/apps',
    headers=headers
)
try:
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
    apps = data.get('result', [])
    print('Found apps:', [(a.get('id'), a.get('name'), a.get('domain')) for a in apps])

    for app in apps:
        domain = app.get('domain', '')
        name = app.get('name', '')
        if 'vojens-proxy' in domain or 'vojens-proxy' in name:
            app_id = app['id']
            print(f'Deleting Access app {app_id}: {domain}')
            req2 = urllib.request.Request(
                f'https://api.cloudflare.com/client/v4/accounts/{account}/access/apps/{app_id}',
                headers=headers, method='DELETE'
            )
            with urllib.request.urlopen(req2) as r2:
                print('Delete result:', r2.read().decode())
except Exception as e:
    print('Access app step error:', e)

# Enable workers.dev subdomain
try:
    payload = json.dumps({'enabled': True}).encode()
    req3 = urllib.request.Request(
        f'https://api.cloudflare.com/client/v4/accounts/{account}/workers/scripts/vojens-proxy/subdomain',
        data=payload, headers=headers, method='PUT'
    )
    with urllib.request.urlopen(req3) as r3:
        print('Subdomain result:', r3.read().decode())
except Exception as e:
    print('Subdomain step error:', e)

print('Done.')
