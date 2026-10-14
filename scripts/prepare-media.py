"""Derive web assets from checked-in artwork without modifying the sources.
Run: python scripts/prepare-media.py (development-only Pillow required).
Episode PNG masters referenced by production metadata are not available locally.
Do not invent resolution: scene variants retain the native 543px and use 360px.
"""
from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets'
report = {}
def save(image, relative, size, quality=65):
    path = ASSETS / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    ImageOps.fit(image.convert('RGB'), size, method=Image.Resampling.LANCZOS).save(path, 'WEBP', quality=quality, method=6)
    report[relative] = {'width': size[0], 'height': size[1], 'bytes': path.stat().st_size}

for source in sorted((ASSETS / 'episodes').glob('*.webp')):
    sheet = Image.open(source)
    width, height = sheet.width // 2, sheet.height // 4
    assert (width, height) == (543, 362), source
    for index in range(8):
        x, y = index % 2 * width, index // 2 * height
        scene = sheet.crop((x, y, x + width, y + height))
        if index == 0:
            save(scene, f'covers/{source.stem}.webp', (480, 320), 48)
        save(scene, f'episodes/{source.stem}/{index+1:02}.webp', (543, 362), 75)
        save(scene, f'episodes/{source.stem}/{index+1:02}-small.webp', (360, 240), 65)

world = Image.open(ASSETS / 'economy-world.png')
save(world.crop((0, 0, world.width//3, world.height//2)), 'ui/hero.webp', (512, 512), 65)
# Face crops are measured from each grade's first panel, not generated identities.
faces = [((42,75,185,218),(196,107,337,248)),((8,112,145,249),(231,139,361,269)),
         ((58,66,204,212),(195,107,337,249)),((83,78,206,201),(194,97,307,210)),
         ((75,64,176,165),(211,88,314,191)),((83,40,205,162),(207,75,338,206))]
for grade in range(1,7):
    sheet = Image.open(ASSETS / f'growth-grade-{grade}.png')
    tile = sheet.crop((0,0,362,362))
    save(tile, f'ui/growth-{grade}.webp', (362,362), 60)
    for name, crop in zip(('jiwoo','harin'), faces[grade-1]):
        save(tile.crop(crop), f'ui/{name}-{grade}.webp', (96,96), 75)
save(Image.open(ASSETS/'growth-grade-1.png').crop((30,239,107,316)), 'ui/moa.webp', (96,96), 75)
(ROOT/'production/media-manifest.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf8')
print(f'{len(report)} images; covers {sum(v["bytes"] for k,v in report.items() if k.startswith("covers/")):,} bytes')
