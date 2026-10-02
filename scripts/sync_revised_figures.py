"""Export revised book figures in their original TikZ fonts and colours."""
from pathlib import Path
import json, re, subprocess, hashlib
import fitz
from PIL import Image, ImageChops
import final_sources

ROOT=Path(__file__).resolve().parents[1]
EDITION=json.loads((ROOT/'src/book-edition.json').read_text(encoding='utf-8'))
BOOK=ROOT/EDITION['source_directory']
WORK=ROOT/'work/troels-slides-2026-10-02'
WORK.mkdir(parents=True,exist_ok=True)
final_sources.BOOK=BOOK
SELECT={
    'fig:kap2_diskontering_geninvestering':'ch02-ytm-geninvestering',
    'fig:kap3_teoretiske_markedspriser':'ch03-fig004',
    'fig:kap4_KonveksPrisRenteGraf':'ch04-fig004',
    'fig:realkredit_balance':'ch05-fig003',
}

def export():
    main=final_sources.active((BOOK/'main.tex').read_text(encoding='utf-8'))
    preamble=main.split('\\begin{document}')[0]
    preamble=re.sub(r'\\makeindex\s*\[.*?\]','',preamble,flags=re.S)
    preamble+='\n\\geometry{paperwidth=230mm,paperheight=330mm,left=30mm,right=30mm,top=20mm,bottom=20mm}\n'
    chapters=re.findall(r'\\include\{(Kapitler/[^}]+)\}',main)
    fragments={}
    for chapter in chapters:
        text=final_sources.expand(BOOK/(chapter+'.tex'))
        for m in re.finditer(r'\\begin\{figure\}(?:\[[^\]]*\])?.*?\\end\{figure\}',text,re.S):
            for label,asset in SELECT.items():
                if '\\label{'+label+'}' in m[0]:fragments[asset]=m[0]
    assert set(fragments)==set(SELECT.values()),fragments.keys()
    bodies=[]
    for asset in SELECT.values():
        body=re.sub(r'\\begin\{figure\}(?:\[[^\]]*\])?|\\end\{figure\}','',fragments[asset])
        body=final_sources.drop_command(body,'caption')
        body=final_sources.drop_command(body,'label')
        bodies.append('\\clearpage\n\\begingroup\n'+body+'\n\\par\\endgroup\n')
    source=WORK/'revised-figures.tex'
    source.write_text(preamble+'\n\\begin{document}\n\\pagestyle{empty}\n'+''.join(bodies)+'\\end{document}\n',encoding='utf-8')
    with (WORK/'figures-build.log').open('w',encoding='utf-8') as log:
        subprocess.run(['pdflatex','-interaction=nonstopmode','-halt-on-error',f'-output-directory={WORK}',str(source)],cwd=BOOK,stdout=log,stderr=subprocess.STDOUT,check=True)
    doc=fitz.open(WORK/'revised-figures.pdf')
    assert len(doc)==len(SELECT)
    records=[]
    for page,(label,asset) in zip(doc,SELECT.items()):
        pix=page.get_pixmap(matrix=fitz.Matrix(2,2),alpha=False)
        im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
        bbox=ImageChops.difference(im,Image.new('RGB',im.size,'white')).convert('L').point(lambda p:255 if p>20 else 0).getbbox()
        assert bbox
        rect=fitz.Rect(*(v/2 for v in bbox))+(-3,-3,3,3)
        crop=fitz.open();p=crop.new_page(width=rect.width,height=rect.height)
        p.show_pdf_page(p.rect,doc,page.number,clip=rect)
        target=ROOT/'src/images/final'/f'{asset}.svg'
        target.write_text(p.get_svg_image(text_as_path=True),encoding='utf-8')
        p.get_pixmap(matrix=fitz.Matrix(1.5,1.5)).save(WORK/f'{asset}.png')
        # Keep both panels together in the book and provide larger slide panels.
        if asset=='ch02-ytm-geninvestering':
            heading=p.search_for('B. De modtagne kuponer geninvesteres')
            assert len(heading)==1
            split=heading[0].y0-5
            for suffix,panelrect in [('a',fitz.Rect(0,0,p.rect.width,split)),('b',fitz.Rect(0,split,p.rect.width,p.rect.height))]:
                panel=fitz.open();q=panel.new_page(width=panelrect.width,height=panelrect.height)
                q.show_pdf_page(q.rect,crop,0,clip=panelrect)
                (target.parent/f'{asset}-{suffix}.svg').write_text(q.get_svg_image(text_as_path=True),encoding='utf-8')
        records.append(dict(label=label,asset=asset,source_sha256=hashlib.sha256(fragments[asset].encode()).hexdigest(),asset_sha256=hashlib.sha256(target.read_bytes()).hexdigest(),width=rect.width,height=rect.height))
    (WORK/'revised-figure-inventory.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
    inventory_path=ROOT/'work/final-rebuild/figure-inventory.json'
    if inventory_path.exists():
        inventory=json.loads(inventory_path.read_text(encoding='utf-8'))
        for row in inventory:
            if row['id']=='ch01-fig002':row['chapter']=3
        if not any(row['id']=='ch02-ytm-geninvestering' for row in inventory):
            inventory.append(dict(id='ch02-ytm-geninvestering',chapter=2,labels=['fig:kap2_diskontering_geninvestering'],assets=[],edition=EDITION['edition']))
        inventory_path.write_text(json.dumps(inventory,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Exported',len(records),'revised TikZ figures.')

if __name__=='__main__':export()
