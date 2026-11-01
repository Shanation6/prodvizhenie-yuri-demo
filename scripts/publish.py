"""Publish this authorized static demo through an existing GitHub credential."""
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.error
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
result = subprocess.run(['git', 'credential', 'fill'], input='protocol=https\nhost=github.com\n\n', text=True, capture_output=True, env={**os.environ, 'GCM_INTERACTIVE': 'never'}, timeout=30)
credential = dict(line.split('=', 1) for line in result.stdout.splitlines() if '=' in line)
token = credential.get('password')
if not token:
    raise SystemExit('Existing GitHub authorization is unavailable.')

def api(method, path, data=None):
    request = urllib.request.Request('https://api.github.com' + path, data=json.dumps(data).encode() if data is not None else None, method=method, headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'ProDvizhenie-demo-publisher', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=35) as response:
            body = response.read()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return None
        raise RuntimeError('GitHub API ' + str(error.code) + ': ' + error.read().decode()[:400]) from None

def git(*args):
    proc = subprocess.run(['git', *args], capture_output=True, text=True, encoding='utf-8', errors='replace')
    if proc.returncode:
        raise RuntimeError('Git command failed: ' + ' '.join(args[:2]) + '\n' + proc.stderr[:600])
    return proc.stdout.strip()

state_file = ROOT / '.work' / 'deployment.json'
if '--status' in sys.argv:
    state = json.loads(state_file.read_text(encoding='utf-8'))
    path = '/repos/' + state['owner'] + '/' + state['name']
    build = api('GET', path + '/pages/builds/latest')
    status = {'repository': state['repository'], 'site': state['site'], 'build_status': build.get('status') if build else 'not_started', 'build_error': build.get('error') if build else None}
    try:
        request = urllib.request.Request(state['site'] + '?check=' + state['commit'][:10], headers={'User-Agent': 'ProDvizhenie-demo-check'})
        with urllib.request.urlopen(request, timeout=20) as response:
            html = response.read().decode()
            status.update(http_status=response.status, title_present='ПроДвижение' in html)
    except urllib.error.HTTPError as error:
        status['http_status'] = error.code
    print(json.dumps(status, ensure_ascii=False))
    raise SystemExit(0)

owner = api('GET', '/user')['login']
description = 'ПроДвижение с Юрием Ряжкиным — демонстрационный сайт персонального тренера и SUP'
if state_file.exists():
    state = json.loads(state_file.read_text(encoding='utf-8'))
    if state['owner'].lower() != owner.lower():
        raise SystemExit('Saved deployment belongs to another account.')
    name = state['name']
    repo = api('GET', '/repos/' + owner + '/' + name)
else:
    name = 'prodvizhenie-yuri-demo'
    suffix = 1
    while api('GET', '/repos/' + owner + '/' + name) is not None:
        suffix += 1
        name = 'prodvizhenie-yuri-demo-' + str(suffix)
    repo = api('POST', '/user/repos', {'name': name, 'description': description, 'private': False, 'auto_init': False})
    state_file.parent.mkdir(exist_ok=True)
    state_file.write_text(json.dumps({'owner': owner, 'name': name, 'repository': repo['html_url']}), encoding='utf-8')

site_url = 'https://' + owner.lower() + '.github.io/' + name + '/'
page_file = ROOT / 'index.html'
page_file.write_text(page_file.read_text(encoding='utf-8').replace('https://shanation6.github.io/prodvizhenie-yuri-demo/', site_url), encoding='utf-8')
if not (ROOT / '.git').exists():
    git('init', '-b', 'main')
    git('config', 'user.name', owner)
    git('config', 'user.email', owner + '@users.noreply.github.com')
if 'origin' not in git('remote').splitlines():
    git('remote', 'add', 'origin', repo['clone_url'])
elif git('remote', 'get-url', 'origin') != repo['clone_url']:
    raise SystemExit('Existing origin differs; nothing pushed.')
git('add', '.gitignore', '.nojekyll', 'index.html', 'assets', 'scripts', 'README.md')
if git('diff', '--cached', '--name-only'):
    git('commit', '-m', 'feat: launch ProDvizhenie trainer and SUP demo')
git('push', '-u', 'origin', 'main')
path = '/repos/' + owner + '/' + name
pages = api('GET', path + '/pages')
if pages is None:
    pages = api('POST', path + '/pages', {'source': {'branch': 'main', 'path': '/'}, 'build_type': 'legacy'})
elif pages.get('source') != {'branch': 'main', 'path': '/'}:
    pages = api('PUT', path + '/pages', {'source': {'branch': 'main', 'path': '/'}, 'build_type': 'legacy'})
state = {'owner': owner, 'name': name, 'repository': repo['html_url'], 'site': pages.get('html_url', site_url), 'commit': git('rev-parse', 'HEAD')}
state_file.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(state, ensure_ascii=False))
