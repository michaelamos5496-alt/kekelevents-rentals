#!/usr/bin/env python3
"""Builds responsive images from assets/images/raw/<pexels-id>.jpg
   -> assets/images/<id>-<width>.webp (480, 960, 1600 where the source is wide enough) and <id>-960.jpg (fallback)
   -> data/images.json with the intrinsic size of each source, so pages can reserve space (no layout shift).
   Run:  python3 scripts/make-images.py        (needs Pillow)
   Replace any placeholder photo with a real one by dropping <id>.jpg into assets/images/raw/ and re-running."""
import glob, json, os
from PIL import Image
RAW, OUT = 'assets/images/raw', 'assets/images'
sizes = {}
for f in sorted(glob.glob(f'{RAW}/*.jpg')):
    id_ = os.path.basename(f)[:-4]
    try: im = Image.open(f).convert('RGB')
    except Exception as e: print('skip', f, e); continue
    w, h = im.size; sizes[id_] = {'w': w, 'h': h}
    for tw in (480, 960, 1600):
        if tw > w and tw != 480: continue
        tw = min(tw, w); th = round(h * tw / w)
        r = im.resize((tw, th), Image.LANCZOS)
        r.save(f'{OUT}/{id_}-{tw}.webp', 'WEBP', quality=78, method=6)
        if tw == min(960, w): r.save(f'{OUT}/{id_}-960.jpg', 'JPEG', quality=80, optimize=True, progressive=True)
os.makedirs('data', exist_ok=True)
json.dump(sizes, open('data/images.json', 'w'), indent=1)
print(len(sizes), 'images processed')
