"""Inventory active TeX inclusions and export original figures (no market API calls)."""
from pathlib import Path
import re, json, hashlib, argparse

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'work/final-rebuild'
BOOK = WORK / 'sources/book'

def active(text):
    # TeX comments swallow the line ending. Keep the percent marker so macro
    # definitions and PGF calculations retain exactly that whitespace behaviour.
    return '\n'.join(re.sub(r'(?<!\\)%.*', '%', line) for line in text.splitlines())

def expand(path, chain=()):
    assert path not in chain, path
    text = active(path.read_text(encoding='utf-8'))
    def sub(m):
        child = BOOK / (m[1] if m[1].endswith('.tex') else m[1]+'.tex')
        return expand(child, (*chain, path))
    return re.sub(r'\\(?:input|include)\{([^}]+)\}', sub, text)

def drop_command(text, command):
    pattern = re.compile(r'\\'+command+r'(?:\[[^\]]*\])?\s*\{')
    while m := pattern.search(text):
        i, depth = m.end(), 1
        while depth and i < len(text):
            if text[i] == '{' and text[i-1] != '\\': depth += 1
            if text[i] == '}' and text[i-1] != '\\': depth -= 1
            i += 1
        text = text[:m.start()] + text[i:]
    return text

def inventory():
    main = active((BOOK/'main.tex').read_text(encoding='utf-8'))
    chapters = re.findall(r'\\include\{(Kapitler/[^}]+)\}', main)
    figures=[]
    export=[]
    for ch, file in enumerate(chapters,1):
        text = expand(BOOK/(file+'.tex'))
        (WORK/f'ch{ch:02}-expanded.tex').write_text(text,encoding='utf-8')
        # captionof is used for the active OAS index. Capture that enclosing center too.
        pattern=r'\\begin\{figure\}(?:\[[^\]]*\])?.*?\\end\{figure\}|\\begin\{center\}(?:(?!\\end\{center\}).)*\\captionof\{figure\}.*?\\end\{center\}'
        for n,m in enumerate(re.finditer(pattern,text,re.S),1):
            fragment=m[0]
            fid=f'ch{ch:02}-fig{n:03}'
            labels=re.findall(r'\\label\{([^}]+)\}',fragment)
            assets=re.findall(r'\\includegraphics(?:\[[^\]]*\])?\s*\{([^}]+)\}',fragment)
            figures.append(dict(id=fid,chapter=ch,chapter_source=file+'.tex',labels=labels,assets=assets,sha256=hashlib.sha256(fragment.encode()).hexdigest(),html='pending',pdf='pending'))
            (WORK/'review'/f'{fid}.tex').write_text(fragment,encoding='utf-8')
            body=re.sub(r'\\begin\{figure\}(?:\[[^\]]*\])?|\\end\{figure\}', '',fragment)
            body=drop_command(body,r'captionof\{figure\}')
            body=drop_command(body,'caption') if '\\begin{subfigure}' not in body else body
            # Keep subpanel captions; remove only the final outer caption.
            if '\\end{subfigure}' in body:
                split=body.rfind('\\end{subfigure}')+len('\\end{subfigure}')
                body=body[:split]+drop_command(body[split:],'caption')
            body=drop_command(body,'label')
            export.append('\\clearpage\n\\typeout{FIGURE-ID: '+fid+'}\n\\begingroup\n\\captionsetup{type=figure}\n\\centering\n'+body+'\n\\par\\endgroup\n')
    preamble=main.split('\\begin{document}')[0]
    # The figure anthology must not reset the book's generated index files.
    preamble=re.sub(r'\\makeindex\s*\[.*?\]', '', preamble, flags=re.S)
    # Keep original font, lengths, macros and math. Big paper prevents float splitting;
    # final crop preserves vectors and every panel.
    preamble += '\n\\geometry{paperwidth=230mm,paperheight=330mm,left=30mm,right=30mm,top=20mm,bottom=20mm}\n'
    special=active((BOOK/'tikz/kapitel06/fig_kap6_ck92_debitorfordeling.tex').read_text(encoding='utf-8')).split('\\begin{figure}')[0]
    preamble += special
    labels='\n'.join(line for p in BOOK.glob('Kapitler/*.aux') for line in p.read_text(encoding='utf-8').splitlines() if line.startswith('\\newlabel'))
    preamble+='\n\\makeatletter\n'+labels+'\n\\makeatother\n'
    # One included source defines colors before its figure environment.
    extras=[]
    for path in [*BOOK.glob('tikz/**/*.tex'),*BOOK.glob('Kapitler/*.tex')]:
        t=active(path.read_text(encoding='utf-8'))
        extras.extend(re.findall(r'\\definecolor\{[^}]+\}\{[^}]+\}\{[^}]+\}',t))
    (BOOK/'figure-export.tex').write_text(preamble+'\n'.join(dict.fromkeys(extras))+'\n\\begin{document}\n\\pagestyle{empty}\n'+''.join(export)+'\\end{document}',encoding='utf-8')
    (WORK/'figure-inventory.json').write_text(json.dumps(figures,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Figures:',len(figures),{ch:sum(f['chapter']==ch for f in figures) for ch in range(1,11)})

def svg():
    import fitz
    from PIL import Image,ImageChops
    figures=json.loads((WORK/'figure-inventory.json').read_text(encoding='utf-8'))
    doc=fitz.open(BOOK/'figure-export.pdf')
    if len(doc)!=len(figures): raise RuntimeError(f'{len(doc)} pages for {len(figures)} figures')
    dest=ROOT/'src/images/final';dest.mkdir(parents=True,exist_ok=True)
    for page,f in zip(doc,figures):
        pix=page.get_pixmap(matrix=fitz.Matrix(2,2),alpha=False)
        im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
        bbox=ImageChops.difference(im,Image.new('RGB',im.size,'white')).convert('L').point(lambda p:255 if p>20 else 0).getbbox()
        assert bbox,f
        rect=fitz.Rect(*(v/2 for v in bbox))+(-3,-3,3,3)
        crop=fitz.open();p=crop.new_page(width=rect.width,height=rect.height)
        p.show_pdf_page(p.rect,doc,page.number,clip=rect)
        (dest/(f['id']+'.svg')).write_text(p.get_svg_image(text_as_path=True),encoding='utf-8')
        crop.save(WORK/'review'/(f['id']+'.pdf'))
        p.get_pixmap(matrix=fitz.Matrix(1.5,1.5)).save(WORK/'review'/(f['id']+'.png'))
        f['pdf_page']=page.number+1;f['width_pt']=rect.width;f['height_pt']=rect.height
    (WORK/'figure-inventory.json').write_text(json.dumps(figures,ensure_ascii=False,indent=2),encoding='utf-8')
    # Additional full-size panels supplement (and never replace) the complete
    # two-panel figure in chapter 8. Original PNG bytes are embedded unchanged.
    import base64
    for suffix,filename in [('a','kap8_5NYK2053Returns2024.png'),('b','kap8_1NYKRTLReturns2024.png')]:
        path=BOOK/'Grafer/Kapitel 8'/filename
        im=Image.open(path);w,h=im.size
        encoded=base64.b64encode(path.read_bytes()).decode()
        (dest/f'ch08-fig005-{suffix}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {w} {h}" width="{w}" height="{h}"><image width="{w}" height="{h}" xlink:href="data:image/png;base64,{encoded}"/></svg>',encoding='utf-8')
    # Two exact vector panels of the pensions figure. Its shared source note
    # is repeated unchanged under each crop; the full figure remains available.
    pensions=fitz.open(BOOK/'Grafer/Kapitel 9/kap9_pensionssektor_realkredit_2007_2009.pdf')
    for suffix,rect in [('a',fitz.Rect(0,36,828,302)),('b',fitz.Rect(0,302,828,591))]:
        panel=fitz.open();p=panel.new_page(width=828,height=rect.height+49)
        p.show_pdf_page(fitz.Rect(0,0,828,rect.height),pensions,0,clip=rect)
        p.show_pdf_page(fitz.Rect(0,rect.height+5,828,rect.height+49),pensions,0,clip=fitz.Rect(0,600,828,644))
        (dest/f'ch09-fig009-{suffix}.svg').write_text(p.get_svg_image(text_as_path=True),encoding='utf-8')
    print('Exported',len(figures),'SVGs from original TeX.')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('action',choices=['inventory','svg']);a=p.parse_args()
    globals()[a.action]()
