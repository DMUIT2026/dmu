# Downloads every image/document referenced by the migrated content into migration/media/
import json, os, sys, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
data, out = sys.argv[1], sys.argv[2]
a = json.load(open(os.path.join(data, 'assets.json')))
urls = sorted(set(a['images'] + a['docs']))
def local(u):
    p = urllib.parse.urlsplit(u).path
    p = p.split('/wp-content/uploads/', 1)[-1] if '/wp-content/uploads/' in p else 'other/' + p.lstrip('/')
    return os.path.join(out, urllib.parse.unquote(p))
def get(u):
    u0 = u; u = u.split('#')[0].replace('http://', 'https://')
    dst = local(u)
    if os.path.exists(dst) and os.path.getsize(dst) > 0: return u, 'cached', dst
    if 'dmu.ae' not in u: return u, 'external', None
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    try:
        r = urllib.request.urlopen(urllib.request.Request(urllib.parse.quote(u, safe=':/%?=&'), headers={'User-Agent': 'Mozilla/5.0 DMU-migration'}), timeout=90)
        open(dst, 'wb').write(r.read()); return u, 'ok', dst
    except Exception as e:
        return u, f'fail {getattr(e, "code", e)}', None
res = {}
with ThreadPoolExecutor(10) as ex:
    for i, (u, st, dst) in enumerate(ex.map(get, urls)):
        u = next((x for x in urls if x.split('#')[0].replace('http://','https://') == u), u)
        res[u] = {'status': st, 'file': os.path.relpath(dst, out) if dst else None}
        if i % 200 == 0: print(i, len(urls), flush=True)
json.dump(res, open(os.path.join(data, 'media_map.json'), 'w'), indent=1)
from collections import Counter
print(Counter(v['status'].split()[0] for v in res.values()))
