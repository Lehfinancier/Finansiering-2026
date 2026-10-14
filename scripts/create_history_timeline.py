from pathlib import Path
from html import escape
items=[('1171–72','Venedig',['Krigslån']),('1648','Nederlandene',['Et digelån']),('1694','England',['Bank of England']),('1790','USA',['Hamiltons reform']),('1795–97','København',['Brand og kreditkasse']),('1803','USA',['Louisiana-købet']),('1917–18','USA',['Liberty Bonds'])]
s=['<svg xmlns="http://www.w3.org/2000/svg" width="1220" height="420" viewBox="0 0 1220 420" role="img" aria-labelledby="title desc"><title id="title">Obligationsmarkedets historie</title><desc id="desc">Syv udvalgte begivenheder fra Venedigs krigslån til Liberty Bonds. Afstandene er ikke en tidsskala.</desc><rect width="1220" height="420" fill="#fafaf7"/><path d="M65 200 H1160" stroke="#b7cdcc" stroke-width="5"/><path d="M1160 194 L1172 200 L1160 206" fill="#008b8c"/>']
for i,(year,place,lines) in enumerate(items):
 x=85+i*175;up=i%2==0;edge=130 if up else 270
 s.append(f'<path d="M{x} 200 V{edge}" stroke="#008b8c" stroke-width="2"/><circle cx="{x}" cy="200" r="9" fill="#008b8c"/><circle cx="{x}" cy="200" r="4" fill="#fafaf7"/>')
 ys=(47,82,111) if up else (309,344,373)
 for y,txt,color,size,weight in [(ys[0],year,'#007f80',25,650),(ys[1],place,'#173545',23,650),(ys[2],lines[0],'#526770',18,400)]:
  s.append(f'<text x="{x}" y="{y}" text-anchor="middle" fill="{color}" font-family="Segoe UI, Arial, sans-serif" font-size="{size}" font-weight="{weight}">{escape(txt)}</text>')
s.append('</svg>');Path('src/images/history/timeline.svg').write_text(''.join(s),encoding='utf8')
