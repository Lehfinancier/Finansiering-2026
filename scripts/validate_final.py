from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,unquote
import csv,hashlib,json,re,zipfile
import fitz
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT/'work/final-rebuild';DOCS=ROOT/'docs'
errors=[];summary=[]
def require(test,message):
    if not test:errors.append(message)
class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[];self.ids=set()
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.add(a['id'])
        for key in ['href','src']:
            if key in a:self.links.append(a[key])
for row in json.loads((WORK/'source-manifest.json').read_text(encoding='utf-8')):
    require(hashlib.sha256((ROOT/row['archive']).read_bytes()).hexdigest()==row['sha256'],'Original archive changed: '+row['archive'])
    source_dir=WORK/'sources'/('book' if 'lecture_notes' in row['archive'] else 'exercises')
    with zipfile.ZipFile(ROOT/row['archive']) as archive:
        for item in archive.infolist():
            if not item.is_dir():
                file=source_dir/item.filename
                require(file.exists() and file.read_bytes()==archive.read(item),'Extracted original changed: '+item.filename)
for asset in (ROOT/'src/images/final').glob('*.svg'):
    public=DOCS/'images/final'/asset.name
    require(public.exists() and public.read_bytes()==asset.read_bytes(),'Public figure mismatch: '+asset.name)
figures=json.loads((WORK/'figure-inventory.json').read_text(encoding='utf-8'))
for ch in range(0,11):
    stem=f'{ch:02}';qmd=(ROOT/f'src/slides/chapters/{stem}.qmd').read_text(encoding='utf-8')
    ids=re.findall(r'^## .*\{#([^}]+)',qmd,re.M)
    require(len(ids)==len(set(ids)),f'Chapter {ch}: duplicate slide IDs')
    require('MBB' not in qmd,f'Chapter {ch}: MBB found')
    for f in [f for f in figures if f['chapter']==ch]:
        require(f['id']+'.svg' in qmd,f'Missing active figure {f["id"]}')
    html=DOCS/f'slides/chapters/{stem}.html'
    require(html.exists(),f'Missing HTML {ch}')
    if html.exists():
        rendered=html.read_text(encoding='utf-8')
        for sid in ids:require(f'id="{sid}"' in rendered,f'Missing rendered ID {sid}')
        require('Reveal.initialize' in rendered,f'Not a Reveal deck: {ch}')
    pdf=fitz.open(DOCS/f'downloads/kapitel-{stem}.pdf')
    require(len(pdf)==len(ids)+1,f'PDF chapter {ch}: {len(pdf)} pages for {len(ids)+1} slides')
    require(all(abs(p.rect.width/p.rect.height-16/9)<0.01 for p in pdf),f'Aspect ratio ch{ch}')
    qa=json.loads((WORK/f'qa/ch{stem}.json').read_text(encoding='utf-8'))
    for key,file in [('source_sha256',ROOT/f'src/slides/chapters/{stem}.qmd'),('html_sha256',html),('pdf_sha256',DOCS/f'downloads/kapitel-{stem}.pdf')]:
        require(qa.get(key)==hashlib.sha256(file.read_bytes()).hexdigest(),f'QA does not match current {key}: chapter {ch}')
    require(not qa['failures'],f'Browser errors chapter {ch}: {qa["failures"]}')
    for s in qa['slides']:
        require(not s['overflow'],f'Overflow {s["id"]}: {s["overflow"]}')
        require(not s['mathErrors'],f'Math errors {s["id"]}')
        require(all(i['ok'] for i in s['images']),f'Missing image {s["id"]}')
    summary.append({'chapter':ch,'content_slides':len(ids),'pdf_pages':len(pdf),'figures':sum(f['chapter']==ch for f in figures)})
for row in json.loads((WORK/'download-manifest.json').read_text(encoding='utf-8')):
    require((DOCS/'downloads'/row['public']).read_bytes()==(ROOT/row['source']).read_bytes(),'Exercise PDF mismatch '+row['public'])
require((DOCS/'downloads/Kurs100-2026.pdf').read_bytes()==(WORK/'sources/book/main.pdf').read_bytes(),'Book download mismatch')
expected={f'kapitel-{n:02}.pdf' for n in range(0,11)}|{f'OS{n}.pdf' for n in range(1,6)}|{'Kurs100-2026.pdf'}
require({p.name for p in DOCS.rglob('*.pdf')}==expected,'Unexpected or missing public PDFs')
require(len(list((DOCS/'slides').rglob('*.html')))==11,'Stale or missing public decks')
for path in DOCS.rglob('*'):
    if path.is_file():require(not re.search(r'loesning|løsning|_med_|\.tex$|\.qmd$',str(path.relative_to(DOCS)),re.I),f'Private source/solution output: {path}')
for path in DOCS.rglob('*.html'):
    parser=Links();text=path.read_text(encoding='utf-8');parser.feed(text)
    for link in parser.links:
        if not link or link.startswith(('data:','javascript:','mailto:','tel:','https:','http:')):continue
        u=urlparse(link)
        require(not re.match(r'^[A-Za-z]:',link),'Windows path in public link '+link)
        target=unquote(u.path)
        if target.startswith('/Finansiering-2026/'):dest=DOCS/target[len('/Finansiering-2026/'):]
        elif target.startswith('/'):dest=DOCS/target.lstrip('/')
        else:dest=path.parent/target if target else path
        if dest.is_dir():dest=dest/'index.html'
        require(dest.exists(),f'Broken link {path.relative_to(DOCS)} -> {link}')
        if dest.exists() and dest.suffix=='.html' and u.fragment:
            other=Links();other.feed(dest.read_text(encoding='utf-8'))
            require(unquote(u.fragment) in other.ids,f'Broken anchor {link}')
result={'introduction':summary[0],'chapters':summary[1:],'errors':errors,'passed':not errors}
(WORK/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
