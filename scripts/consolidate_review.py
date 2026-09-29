from pathlib import Path
import csv,json,re,hashlib
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT/'work/final-rebuild';REVIEW=WORK/'review'
signoff=json.loads((WORK/'visual-review-complete.json').read_text(encoding='utf-8'))
for ch in range(1,11):
    for key,file in [('source_sha256',ROOT/f'src/slides/chapters/{ch:02}.qmd'),('html_sha256',ROOT/f'docs/slides/chapters/{ch:02}.html'),('pdf_sha256',ROOT/f'docs/downloads/kapitel-{ch:02}.pdf')]:
        assert signoff[f'{ch:02}'][key]==hashlib.sha256(file.read_bytes()).hexdigest(),f'Visual review is stale: chapter {ch}, {key}'
rows=[]
for ch in range(1,11):
    source=REVIEW/f'ch{ch:02}-coverage.csv'
    for r in csv.DictReader(source.open(encoding='utf-8-sig')):
        location=r.get('lines',r.get('source_lines_or_input','')) or f'{r.get("line_start","")}-{r.get("line_end","")}'
        rows.append(dict(chapter=ch,source_id=r['source_id'],section=r.get('section',''),source_file=r.get('source',r.get('source_file','')),source_location=location,kind=r.get('type',r.get('kind','')),source_point=r.get('content',r.get('point_formula_example_table',r.get('source_point',''))),slide_ids=r.get('slides',r.get('slide_id','')),HTML=r.get('HTML',r.get('html','')),PDF=r.get('PDF',r.get('pdf',''))))
with (WORK/'coverage-matrix.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=rows[0].keys());w.writeheader();w.writerows(rows)
errors=[]
for ch in range(1,11):
    qmd=(ROOT/f'src/slides/chapters/{ch:02}.qmd').read_text(encoding='utf-8')
    ids=set(re.findall(r'^## .*\{#([^}]+)',qmd,re.M))
    for r in (r for r in rows if r['chapter']==ch):
        targets=re.findall(r'ch\d+-s\d+',r['slide_ids'])
        if not targets:errors.append('No target: '+r['source_id'])
        for target in targets:
            if target not in ids:errors.append(f'{r["source_id"]}: missing {target}')
figures=json.loads((WORK/'figure-inventory.json').read_text(encoding='utf-8'))
for fig in figures:
    ch=fig['chapter'];qmd=(ROOT/f'src/slides/chapters/{ch:02}.qmd').read_text(encoding='utf-8')
    blocks=re.split(r'(?=^## )',qmd,flags=re.M)
    fig['slides']=[re.search(r'\{#([^}]+)',b)[1] for b in blocks if fig['id']+'.svg' in b]
    fig['html']='pass: all mapped slides visually reviewed'
    fig['pdf']='pass: actual PDF pages visually reviewed'
    fig['asset_sha256']=hashlib.sha256((ROOT/f'src/images/final/{fig["id"]}.svg').read_bytes()).hexdigest()
(WORK/'figure-inventory.json').write_text(json.dumps(figures,ensure_ascii=False,indent=2),encoding='utf-8')
counts={str(ch):sum(r['chapter']==ch for r in rows) for ch in range(1,11)}
(WORK/'coverage-validation.json').write_text(json.dumps({'source_points':len(rows),'by_chapter':counts,'errors':errors,'passed':not errors},ensure_ascii=False,indent=2),encoding='utf-8')
print(len(rows),'source points;',len(figures),'figures;',len(errors),'mapping errors')
if errors:raise SystemExit('\n'.join(errors))
