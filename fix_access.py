import urllib.request, json, os

token = os.environ['CF_TOKEN']
account = os.environ['CF_ACCOUNT']
headers = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}

# Enable workers.dev subdomain
payload = json.dumps({'enabled': True}).encode()
req = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/accounts/{account}/workers/scripts/vojens-proxy/subdomain',
    data=payload, headers=headers, method='PUT'
)
with urllib.request.urlopen(req) as r:
    result = r.read().decode()
    print('Subdomain result:', result)

print('Done.')
