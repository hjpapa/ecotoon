"""Development only: pip install fonttools brotli, then pass the upstream TTF.
Source: https://github.com/google/fonts/tree/main/ofl/notosanskr (OFL.txt).
Includes site text, KS X 1001 Hangul, Jamo, Latin and punctuation.
"""
import pathlib
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

root = pathlib.Path(__file__).resolve().parent.parent
chars = set(range(0x20, 0x100)) | set(range(0x1100, 0x1200)) | set(range(0x3130, 0x3190))
chars |= set(range(0x2000, 0x2070)) | set(range(0x3000, 0x3040))
for code in range(0xAC00, 0xD7A4):
    if len(chr(code).encode('euc_kr')) == 2:
        chars.add(code)
for source in [root / 'index.html', *root.glob('*.js'), *(root / 'games').glob('*.js')]:
    chars.update(map(ord, source.read_text(encoding='utf-8')))
for weight in [400, 700]:
    font = instantiateVariableFont(TTFont(sys.argv[1]), {'wght': weight}, inplace=True)
    options = subset.Options()
    options.name_IDs = ['*']  # Keep copyright and license metadata.
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=chars)
    sub.subset(font)
    font.flavor = 'woff2'
    target = root / 'assets' / 'fonts' / ('noto-sans-kr-' + str(weight) + '.woff2')
    font.save(target)
    print(target.name, target.stat().st_size)
