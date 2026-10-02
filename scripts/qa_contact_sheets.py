"""Render every actual PDF page and assemble labelled visual review sheets."""
from pathlib import Path
import argparse, json
from PIL import Image,ImageOps,ImageDraw
import fitz
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT/'work/final-rebuild'
def sheets(files,dest,cols=3,rows=3,width=640,height=390):
    dest.mkdir(parents=True,exist_ok=True)
    result=[]
    for offset in range(0,len(files),cols*rows):
        canvas=Image.new('RGB',(cols*width,rows*height),'#d8e1e2');draw=ImageDraw.Draw(canvas)
        for i,f in enumerate(files[offset:offset+cols*rows]):
            im=Image.open(f).convert('RGB');im.thumbnail((width-12,height-28))
            x=(i%cols)*width;y=(i//cols)*height
            canvas.paste(im,(x+(width-im.width)//2,y+23))
            draw.text((x+8,y+5),str(f.parent.name)+' / '+f.stem,fill='#173545')
        name=dest/f'{offset//(cols*rows)+1:03}.jpg';canvas.save(name,quality=93);result.append(str(name.relative_to(ROOT)))
    return result
def figures():
    return sheets(sorted((WORK/'review').glob('ch*-fig*.png')),WORK/'qa/figures',cols=3,rows=2,width=680,height=500)
def chapter(ch):
    folder=WORK/'qa'/f'ch{ch}'
    qa=json.loads((WORK/'qa'/f'ch{ch}.json').read_text(encoding='utf-8'))
    html=sheets([folder/f'{n:03}.png' for n in range(1,qa['count']+1)],folder/'html-sheets')
    pdf=fitz.open(ROOT/f'docs/downloads/kapitel-{ch}.pdf')
    pdfdir=folder/'pdf';pdfdir.mkdir(exist_ok=True)
    for n,page in enumerate(pdf):
        page.get_pixmap(matrix=fitz.Matrix(1.25,1.25),alpha=False).save(pdfdir/f'{n+1:03}.png')
    out=sheets([pdfdir/f'{n:03}.png' for n in range(1,len(pdf)+1)],folder/'pdf-sheets')
    return {'chapter':ch,'pages':len(pdf),'html':html,'pdf':out}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('chapters',nargs='*');a=p.parse_args()
    if a.chapters==['figures']:print(json.dumps(figures()))
    else:
        for ch in a.chapters or [f'{n:02}' for n in range(0,11)]:print(json.dumps(chapter(ch)))
