"""Collect public channel photos for the demonstration website."""
from pathlib import Path
from bs4 import BeautifulSoup
from PIL import Image, ImageOps, ImageDraw
import urllib.request, re, sys, json, concurrent.futures

sys.stdout.reconfigure(encoding='utf-8')
root = Path(__file__).resolve().parent.parent
stage = root / '.work'
stage.mkdir(parents=True, exist_ok=True)
urls = ['https://t.me/s/prodvizhenieryazhkin?before=57', 'https://t.me/s/prodvizhenieryazhkin?before=77', 'https://t.me/s/prodvizhenieryazhkin']
posts, jobs = [], []
for url in urls:
    soup = BeautifulSoup(urllib.request.urlopen(url, timeout=25).read(), 'html.parser')
    for el in soup.select('.tgme_widget_message[data-post]'):
        post = el['data-post']
        txt = el.select_one('.tgme_widget_message_text')
        text = txt.get_text(' ', strip=True) if txt else ''
        photos = []
        for media in el.select('.tgme_widget_message_photo_wrap,.tgme_widget_message_video_thumb'):
            match = re.search(r"background-image:url\(['\"](.*?)['\"]\)", media.get('style', ''))
            if match:
                photos.append(match.group(1))
        posts.append({'post': post, 'text': text, 'images': photos})
        jobs.extend((post.split('/')[-1] + '-' + str(i), u) for i, u in enumerate(photos))
        print(post, 'images:', len(photos), text[:140])
profile = BeautifulSoup(urllib.request.urlopen('https://t.me/prodvizhenieryazhkin', timeout=20).read(), 'html.parser')
avatar = profile.select_one('meta[property="og:image"]')
if avatar:
    jobs.append(('avatar', avatar['content']))
(stage / 'source.json').write_text(json.dumps(posts, ensure_ascii=False, indent=2), encoding='utf-8')

def download(job):
    name, url = job
    try:
        path = stage / (name + '.jpg')
        if not path.exists():
            path.write_bytes(urllib.request.urlopen(url, timeout=25).read())
        return name, Image.open(path).convert('RGB')
    except Exception:
        return name, None

valid = [(name, im) for name, im in concurrent.futures.ThreadPoolExecutor(max_workers=7).map(download, jobs) if im]
board = Image.new('RGB', (1250, 235 * ((len(valid) + 4) // 5)), '#e9e6dc')
draw = ImageDraw.Draw(board)
for i, (name, im) in enumerate(valid):
    x, y = (i % 5) * 250, (i // 5) * 235
    board.paste(ImageOps.fit(im, (240, 195)), (x, y))
    draw.text((x + 8, y + 199), name + ' / ' + str(im.size), fill='black')
board.save(stage / 'contact-sheet.jpg')
print('Downloaded:', len(valid))
