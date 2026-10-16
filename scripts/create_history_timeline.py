from pathlib import Path
from html import escape

# Two chronological rows, with a return arrow between them. Spacing is not to scale.
items = [
    ('1171–72', 'Venedig', 'Krigslån'),
    ('1648', 'Nederlandene', 'Et digelån'),
    ('1694', 'England', 'Bank of England'),
    ('1790', 'USA', 'Hamiltons reform'),
    ('1795–97', 'København', 'Brand og kreditkasse'),
    ('1803', 'USA', 'Louisiana-købet'),
    ('1917–18', 'USA', 'Liberty Bonds'),
    ('1970–80’erne', 'Milken', 'High yield vokser'),
    ('1970–80’erne', 'Ranieri', 'Boliglån på Wall Street'),
    ('2007–09', 'Finanskrisen', 'Tab på risikable lån'),
]
s = ['<svg xmlns="http://www.w3.org/2000/svg" width="1220" height="420" viewBox="0 0 1220 420" role="img" aria-labelledby="title desc"><title id="title">Obligationsmarkedets historie</title><desc id="desc">Ti nedslag fra Venedig til finanskrisen. Læs hver række fra venstre mod højre, øverste række først. Afstandene er ikke en tidsskala.</desc><rect width="1220" height="420" fill="#fafaf7"/><defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="none" stroke="#008b8c"/></marker></defs>']
for y in (135, 335):
    s.append(f'<path d="M75 {y} H1165" fill="none" stroke="#b7cdcc" stroke-width="3" marker-end="url(#arrow)"/>')
s.append('<path d="M1175 145 V190 H45 V330 H65" fill="none" stroke="#b7cdcc" stroke-width="2" stroke-dasharray="5 5" marker-end="url(#arrow)"/>')
for i, (year, place, detail) in enumerate(items):
    x = 135 + (i % 5) * 237
    y = 135 if i < 5 else 335
    s.append(f'<circle cx="{x}" cy="{y}" r="7" fill="#008b8c"/>')
    for dy, txt, color, size, weight in [(-88, year, '#007f80', 24, 650), (-51, place, '#173545', 24, 650), (-20, detail, '#526770', 18, 400)]:
        s.append(f'<text x="{x}" y="{y+dy}" text-anchor="middle" fill="{color}" font-family="Segoe UI, Arial, sans-serif" font-size="{size}" font-weight="{weight}">{escape(txt)}</text>')
s.append('<text x="610" y="396" text-anchor="middle" fill="#526770" font-family="Segoe UI, Arial, sans-serif" font-size="17">Udvalgte nedslag · Afstandene er ikke en tidsskala</text></svg>')
Path('src/images/history/timeline.svg').write_text(''.join(s), encoding='utf8')
