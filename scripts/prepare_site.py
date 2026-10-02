from pathlib import Path
import shutil, json, hashlib
from datetime import date,timedelta
ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'work/final-rebuild'
titles=['Rentedannelsen','Obligationsmarkedet','Rentestrukturen','Risikomål','Dansk realkredit','Modellering af konverteringsadfærd','Prisfastsættelse og nøgletal','Obligationsafkast','Finanskrisen','Pengeinstitutternes risikostyring']
exercises=['Renter og obligationer','Rentekurve og renterisiko','Realkredit og konvertering','Prisfastsættelse og nøgletal','Afkast, krise og risiko']
chapters=['1–2','3–4','5–6','7','8–10']
course=json.loads((ROOT/'src/course-2026.json').read_text(encoding='utf-8'))
start=date.fromisoformat(course['first_tuesday'])
assert start.weekday()==1 and start.year==course['year'] and course['weeks']==6
modules=[]
for n in range(1,13):
    day=start+timedelta(weeks=(n-1)//2,days=0 if n%2 else 2)
    topic=('Introduktion + '+titles[0]) if n==1 else titles[n-1] if n<=10 else 'Buffer og opsamling' if n==11 else 'Tidligere eksamen som eksempel'
    modules.append(dict(number=n,date=day.isoformat(),week=day.isocalendar().week,day='Tirsdag' if n%2 else 'Torsdag',time=course['tuesday_time'] if n%2 else course['thursday_time'],topic=topic,chapter=n if n<=10 else None))
(WORK/'teaching-plan-2026.json').write_text(json.dumps(modules,ensure_ascii=False,indent=2),encoding='utf-8')
dest=ROOT/'src/downloads';dest.mkdir(exist_ok=True)
manifest=[]
for n in range(1,6):
    files=list((WORK/'sources/exercises').glob(f'OS{n}*/*_uden_loesninger.pdf'))
    assert len(files)==1,files
    shutil.copy2(files[0],dest/f'OS{n}.pdf')
    manifest.append({'public':f'OS{n}.pdf','source':str(files[0].relative_to(ROOT))})
edition_file=ROOT/'src/book-edition.json'
if edition_file.exists():
    edition=json.loads(edition_file.read_text(encoding='utf-8'))
    book=ROOT/edition['pdf_source']
    if book.exists():
        edition['pdf_sha256']=hashlib.sha256(book.read_bytes()).hexdigest()
        edition_file.write_text(json.dumps(edition,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        shutil.copy2(book,dest/'Kurs100-2026.pdf')
    else:
        assert (dest/'Kurs100-2026.pdf').exists(),'Build the revised book before publishing.'
        assert hashlib.sha256((dest/'Kurs100-2026.pdf').read_bytes()).hexdigest()==edition['pdf_sha256'],'Revised book download changed.'
else:
    book=WORK/'sources/book/main.pdf'
    if book.exists():shutil.copy2(book,dest/'Kurs100-2026.pdf')
(WORK/'download-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
text='''---
title: "Finansiering 2026"
pagetitle: "Kurs 100 · Finansiering 2026"
---

::: {.hero}
::: {.course-kicker}
HA.jur. · Finansiering del 2
:::

Vi arbejder med renter, obligationer, dansk realkredit og finansielle kriser. I regneeksemplerne følger vi, hvem der betaler, hvem der får pengene, og hvem der bærer risikoen.

![](images/finance-header-img.png){.finance-header fig-alt="Ryan Gosling forklarer finansiel risiko med et tårn af klodser."}

::: {.course-dates}
20. oktober – 26. november 2026 · 6 uger · 12 undervisningsmoduler
:::

[Hent lektionsnoterne](downloads/Kurs100-2026.pdf){.btn .btn-primary download="Kurs100-2026.pdf"}

[Se lektionsplanen](#lektionsplan){.btn .btn-outline-primary}
:::

## Kursusinformation {#kursusinformation}

::: {.course-info-grid}
::: {.course-info}
### Kontakt

**Forelæser:** Niklas Lehmann Jensen  
**Mail:** [nlj@econ.au.dk](mailto:nlj@econ.au.dk) · [niklas@scanrate.dk](mailto:niklas@scanrate.dk)  
**Træffetid:** Skriv en mail, hvis du har spørgsmål.  
**Kursusrum:** Brightspace og denne side.

**Niveau:** Bachelor, HA.jur. Grundlæggende matematik og økonomi er en fordel.
:::

::: {.course-info .meeting-times}
### Vi mødes to gange om ugen

**Tirsdag kl. 08:15–10:00**  
**Torsdag kl. 14:15–16:00**

Første gang er tirsdag den **20. oktober 2026**. Sidste gang er torsdag den **26. november 2026**.

Lokale og eventuelle ændringer fremgår af Brightspace.
:::
:::

## Kursusintroduktion i slideformat {#introduktion}

```{=html}
<div class="slide-embed">
  <iframe src="slides/chapters/00.html" data-external="1" title="Kursusintroduktion til Finansiering 2026" loading="lazy" allowfullscreen></iframe>
</div>
```

[Åbn introduktionen i fuld skærm](slides/chapters/00.qmd) · [Hent introduktionen som PDF](downloads/kapitel-00.pdf)

## Lektionsplan · efterår 2026 {#lektionsplan}

Vi begynder med introduktionen og kapitel 1 og følger derefter bogens kapitler i rækkefølge. Modul 11 er buffer. I modul 12 gennemgår vi en tidligere eksamen.

::: {.schedule-wrap}
| Modul | Uge | Dato | Tid | Indhold | Læsning |
|:---|:---|:---|:---|:---|:---|
'''
for m in modules:
    d=date.fromisoformat(m['date'])
    reading=f"[Kapitel {m['chapter']}](slides/chapters/{m['chapter']:02}.qmd)" if m['chapter'] else 'Efter behov' if m['number']==11 else 'Tidligere eksamensopgave'
    text+=f"| {m['number']} | {m['week']} | {m['day']} {d:%d/%m} | {m['time']} | {m['topic']} | {reading} |\n"
text+='''
:::

## Slides til de ti kapitler {#kapitler}

Åbn slides i browseren eller hent dem som PDF. Brug piletasterne til at skifte slide og Esc til at se hele kapitlet.

::: {.chapter-grid}
'''
for n,title in enumerate(titles,1):
    text+=f'''\n::: {{.chapter-card}}
::: {{.chapter-no}}
Kapitel {n:02}
:::
### {title}

[Vis slides](slides/chapters/{n:02}.qmd){{.primary-link}}

[Download slides som PDF](downloads/kapitel-{n:02}.pdf){{download="kapitel-{n:02}.pdf"}}
:::
'''
text+='''\n:::

## Øvelsessæt {#oevelser}

Fem øvelsessæt til arbejdet med lektionsnoterne.

| Sæt | Emne | Kapitler | Download |
|:---|:---|:---|:---|
'''
for n,(title,ch) in enumerate(zip(exercises,chapters),1):
    text+=f'| OS{n} | {title} | {ch} | [Hent OS{n}](downloads/OS{n}.pdf) |\n'
text+='''
## Forberedelse

Læs kapitlet før undervisningen. I eksemplerne skal du kunne forklare betalingerne og de antagelser, vi regner med. Brug spørgsmålene på slides og øvelsessættene til selv at regne efter.

Se på datoen og forudsætningerne, når du læser en graf med historiske observationer. Overvej, hvad der sker med betalinger og priser, hvis renten ændrer sig.

## Eksamen og praktiske oplysninger

Vi arbejder med en tidligere eksamen i modul 12 den 26. november. Den aktuelle eksamensdato, prøveform og regler for hjælpemidler fremgår af Brightspace og universitetets eksamensinformation.
'''
(ROOT/'src/index.qmd').write_text(text,encoding='utf-8')
intro='''---
title: "Kursusintroduktion"
subtitle: "Finansiering 2026 · HA.jur."
author: "Niklas Lehmann Jensen"
format: revealjs
---

## Fra boliglån til finanskriser {#intro-s001}

- Hvad bestemmer renten på et lån?
- Hvorfor falder en obligations pris, når renten stiger?
- Hvem bærer risikoen i dansk realkredit?
- Hvordan kan finansielle tab brede sig til resten af økonomien?

::: {.notes}
Lad de studerende nævne en situation, hvor de selv møder renter eller risiko. Knyt deres eksempler til spørgsmålene på sliden.
:::

## Seks uger, to møder om ugen {#intro-s002}

**20. oktober – 26. november 2026**

| Dag | Tid |
|:---|:---|
| Tirsdag | 08:15–10:00 |
| Torsdag | 14:15–16:00 |

12 undervisningsmoduler. Lokale og ændringer findes på Brightspace.

::: {.notes}
Vi begynder tirsdag den 20. oktober. Bed de studerende læse kapitlet før forelæsningen og regne videre bagefter. Vis lektionsplanen på forsiden.
:::
'''
for half in range(2):
    intro+=f"\n## {'Renter, obligationer og realkredit' if half==0 else 'Pris, afkast, risiko og eksamensarbejde'} {{#intro-s00{half+3}}}\n\n| Modul | Dato | Indhold |\n|:---|:---|:---|\n"
    for m in modules[half*6:half*6+6]:
        d=date.fromisoformat(m['date'])
        short={1:'Intro + kapitel 1: Rentedannelsen',6:'Kapitel 6: Konverteringsadfærd',7:'Kapitel 7: Prisfastsættelse og nøgletal',9:'Kapitel 9: Finanskrisen',10:'Kapitel 10: Pengeinstitutternes risiko'}.get(m['number'],f"Kapitel {m['chapter']}: {m['topic']}" if m['chapter'] else m['topic'])
        intro+=f"| {m['number']} | {d:%d/%m} | {short} |\n"
    note=('Vi følger kapitel 1–6 i de første tre uger. De studerende kan bruge slides til forberedelse og regne videre med opgaverne efter undervisningen.' if half==0 else 'Efter kapitel 7–10 har vi et modul til det, vi mangler at nå eller har brug for at vende tilbage til. Sidste gang gennemgår vi en tidligere eksamen.')
    intro+=f'\n::: {{.notes}}\n{note}\n:::\n'
intro+='''
## Materialet er samlet på forsiden {#intro-s005}

- **Lektionsnoter i finansiering 2026:** ti kapitler.
- **Slides:** browserudgave og PDF til hvert kapitel.
- **OS1–OS5:** øvelsessæt til selvstændigt arbejde.
- **Brightspace:** beskeder, lokale og eksamensoplysninger.

::: {.notes}
Vis, hvor de studerende henter noter, slides og øvelsessæt. De kan følge bogens gennemregnede eksempler og derefter prøve metoderne i opgaverne.
:::

## Vi skal kunne forklare det, vi regner {#intro-s006}

1. Læs kapitlet før undervisningen.
2. Følg betalinger, enheder og forudsætninger i eksemplerne.
3. Spørg, hvad der ændrer sig, når vi ændrer en rente eller antagelse.
4. Regn selv videre med øvelsessættene.

::: {.notes}
Bed de studerende spørge, når et mellemtrin er uklart, eller de ikke kan forklare et resultat økonomisk.
:::

## Spørg i timen eller skriv en mail {#intro-s007}

**Niklas Lehmann Jensen**

[nlj@econ.au.dk](mailto:nlj@econ.au.dk)  
[niklas@scanrate.dk](mailto:niklas@scanrate.dk)

Vi gennemgår en tidligere eksamen den **26. november**. Aktuel eksamensdato, prøveform og hjælpemidler fremgår af universitetets eksamensinformation.

::: {.notes}
Henvis til universitetets kursusrum ved spørgsmål om eksamensdato og hjælpemidler. Opgaven den 26. november er fra en tidligere eksamen.
:::
'''
formula_preview=(ROOT/'scripts/templates/intro-formulas.qmd').read_text(encoding='utf-8')
intro=intro.replace('## Vi skal kunne forklare det, vi regner',formula_preview+'\n\n## Vi skal kunne forklare det, vi regner')
(ROOT/'src/slides/chapters/00.qmd').write_text(intro,encoding='utf-8')
config='''project:
  type: website
  output-dir: ../docs
  render:
    - index.qmd
'''+''.join(f'    - slides/chapters/{n:02}.qmd\n' for n in range(0,11))+'''  resources:
    - .nojekyll
    - downloads/*.pdf
    - images/final/*.svg
    - images/finance-header-img.png
    - vendor/mathjax/*
execute:
  freeze: false
  cache: false
website:
  title: "Kurs 100 · Finansiering 2026"
  site-url: https://lehfinancier.github.io/Finansiering-2026/
  repo-url: https://github.com/Lehfinancier/Finansiering-2026
  repo-subdir: src
  search: true
  navbar:
    title: "KURS 100"
    left:
      - text: "Kursusinfo"
        href: index.qmd#kursusinformation
      - text: "Lektionsplan"
        href: index.qmd#lektionsplan
      - text: "Kapitler"
        href: index.qmd#kapitler
      - text: "Lektionsnoter"
        href: downloads/Kurs100-2026.pdf
      - text: "Øvelser"
        href: index.qmd#oevelser
  page-footer: "Finansiering · HA.jur. · Niklas Lehmann Jensen"
format:
  html:
    theme: [cosmo, themes/kurs100-site.scss]
    toc: false
    anchor-sections: true
    embed-resources: true
lang: da
'''
(ROOT/'src/_quarto.yml').write_text(config,encoding='utf-8')
print('Site source and five authorised exercise PDFs prepared.')
