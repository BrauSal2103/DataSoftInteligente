import requests

BASE = 'http://127.0.0.1:8000'

def pretty_print(label, obj):
    import json
    print('---', label, '---')
    print(json.dumps(obj, ensure_ascii=False, indent=2))


def main():
    try:
        p = requests.get(f'{BASE}/api/progress').json()
        pretty_print('progress', p)
    except Exception as e:
        print('progress error', e)

    try:
        ex = requests.get(f'{BASE}/api/examples').json()
        print('examples count:', len(ex) if isinstance(ex, list) else 'N/A')
        if isinstance(ex, list) and ex:
            eid = ex[0]['id']
            print('using example id:', eid)
            r = requests.post(f'{BASE}/api/examples/{eid}/metrics')
            pretty_print('metrics', r.json())
    except Exception as e:
        print('examples/metrics error', e)

if __name__ == '__main__':
    main()
