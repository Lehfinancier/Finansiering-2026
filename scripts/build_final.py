"""Reproducible local build of Kurs 100, using only the two final archives.

Prerequisites: Python (PyMuPDF, Pillow), TeX Live (pdflatex, bibtex, texindy),
Quarto 1.8.23, Node, Playwright and Chrome. No external data is requested.
"""
from pathlib import Path
import argparse,hashlib,json,os,re,shutil,subprocess,zipfile
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT/'work/final-rebuild';BOOK=WORK/'sources/book'
def run(args,cwd=ROOT,log=None):
    env=os.environ.copy()
    env.update(SOURCE_DATE_EPOCH='1790683200',FORCE_SOURCE_DATE='1')
    if log:
        with (WORK/log).open('w',encoding='utf-8') as out:
            subprocess.run(args,cwd=cwd,env=env,stdout=out,stderr=subprocess.STDOUT,check=True)
    else:subprocess.run(args,cwd=cwd,env=env,check=True)
def sources():
    manifest=json.loads((WORK/'source-manifest.json').read_text(encoding='utf-8'))
    for row,name in zip(manifest,['book','exercises']):
        archive=ROOT/row['archive']
        assert hashlib.sha256(archive.read_bytes()).hexdigest()==row['sha256'],f'Changed original: {archive}'
        dest=WORK/'sources'/name
        if not dest.exists():
            dest.mkdir(parents=True)
            with zipfile.ZipFile(archive) as z:
                for item in z.infolist():
                    assert (dest/item.filename).resolve().is_relative_to(dest.resolve())
                z.extractall(dest)
def book():
    run(['pdflatex','-interaction=nonstopmode','-halt-on-error','main.tex'],BOOK,'book-pass1.log')
    # BibTeX does not accept spaces in the included .aux filenames. Flatten
    # generated aux only; no authoritative .tex file is altered.
    text=(BOOK/'main.aux').read_text(encoding='utf-8')
    text=re.sub(r'\\@input\{([^}]+)\}',lambda m:(BOOK/m[1]).read_text(encoding='utf-8'),text)
    (BOOK/'bibliography-build.aux').write_text(text,encoding='utf-8')
    run(['bibtex','bibliography-build'],BOOK,'bibliography.log')
    shutil.copy2(BOOK/'bibliography-build.bbl',BOOK/'main.bbl')
    run(['pdflatex','-interaction=nonstopmode','-halt-on-error','main.tex'],BOOK,'book-pass2.log')
    for i in range(3,6):
        run(['texindy','-L','danish','-C','utf8','stikord.idx'],BOOK,f'index-pass{i}.log')
        run(['pdflatex','-interaction=nonstopmode','-halt-on-error','main.tex'],BOOK,f'book-pass{i}.log')
    log=(BOOK/'main.log').read_text(encoding='utf-8',errors='replace')
    assert 'There were undefined references' not in log
    assert 'There were undefined citations' not in log
def figures():
    run(['python','scripts/final_sources.py','inventory'])
    run(['pdflatex','-interaction=nonstopmode','-halt-on-error','figure-export.tex'],BOOK,'figures-build.log')
    run(['python','scripts/final_sources.py','svg'])
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--slides-only',action='store_true');p.add_argument('--skip-qa-images',action='store_true');a=p.parse_args()
    sources()
    if not a.slides_only:book();figures()
    run(['python','scripts/prepare_site.py'])
    run(['quarto','render','src'],log='quarto-build.log')
    run(['node','scripts/export_slides.cjs'],log='pdf-export.log')
    run(['python','scripts/validate_final.py'],log='validation.log')
    if not a.skip_qa_images:run(['python','scripts/qa_contact_sheets.py'],log='qa-images.log')
    print('Local site: '+str(ROOT/'docs/index.html'))
