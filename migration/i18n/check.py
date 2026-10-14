# usage: python3 check.py NN   -> reports how many items of in-NN.json are translated in out-NN-*.json
import json, sys, glob, re
n = sys.argv[1]
src = json.load(open(f'in-{n}.json'))
done = {}
for f in sorted(glob.glob(f'out-{n}-*.json')):
    try:
        done.update(json.load(open(f)))
    except Exception as e:
        print(f'BROKEN FILE {f}: {e}')
missing = [s['id'] for s in src if s['id'] not in done or not str(done[s['id']]).strip()]
untranslated = [k for k, v in done.items() if not re.search('[؀-ۿ]', str(v)) and re.search('[A-Za-z]{4,}', str(v))]
print(f'batch {n}: {len(src) - len(missing)}/{len(src)} translated; missing {len(missing)}; left in English {len(untranslated)}')
if missing: print('first missing ids:', missing[:20])
