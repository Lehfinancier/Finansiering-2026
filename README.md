# Kurs 100 · Finansiering 2026

Undervisningsmateriale til Finansiering på HA.jur. Kursusintroduktion og ti kapitler med Reveal.js-slides og tilsvarende PDF’er, den endelige lektionsbog og OS1–OS5 uden løsninger. Forsiden bruger det oprindelige Ryan Gosling-billede og samler kursusinformation, introduktion og lektionsplan.

## Åbn lokalt

```powershell
python scripts/preview_final.py
```

Åbn http://127.0.0.1:8765/Finansiering-2026/ . Serveren viser kun `docs/` og bruger sitets faktiske GitHub Pages-basepath.

## Byg

Det fulde build kræver de to private final-arkiver og den lokale kildemanifestfil i `work/final-rebuild/`. De følger ikke med det offentlige repository.

```powershell
python scripts/build_final.py
```

En efterfølgende slideændring kan bygges med:

```powershell
python scripts/build_final.py --slides-only
```

Krav: Quarto 1.8.23, TeX Live med `pdflatex`, `bibtex` og `texindy`, Python med PyMuPDF og Pillow samt Node, Playwright og Chrome. Scriptet kan bruge den installerede Codex-runtime; sæt `CODEX_NODE_MODULES` og `CHROME_PATH` på andre maskiner. MathJax 3.2.2 er gemt lokalt. Build henter ingen markedsdata og foretager ingen publicering.

## Filer

- `src/index.qmd`: kapiteloverblik og downloads.
- `src/course-2026.json`: startdato, undervisningstider og kontaktoplysninger til 2026-planen.
- `src/slides/chapters/00.qmd`: den opdaterede kursusintroduktion, indlejret på forsiden.
- `src/slides/chapters/01.qmd` … `10.qmd`: de ti fælles slidekilder.
- `src/themes/kurs100.scss`: fælles 16:9-slidedesign.
- `src/images/final/`: originale figurer eksporteret fra final-bogen.
- `docs/slides/chapters/01.html` … `10.html`: browserdecks.
- `docs/downloads/kapitel-01.pdf` … `kapitel-10.pdf`: én slide pr. side.
- `docs/slides/chapters/00.html` og `docs/downloads/kapitel-00.pdf`: introduktion i HTML/PDF.
- `docs/downloads/Kurs100-2026.pdf`: den reviderede bog med ændringerne fra Troels-reviewet og de efterfølgende rettelser.
- `src/book-edition.json`: bogudgave, lokal kildeplacering og hash for den publicerede PDF.
- `scripts/sync_revised_figures.py`: eksport af reviderede TikZ-figurer til slides med bogens skrifter og farver.
- `docs/downloads/OS1.pdf` … `OS5.pdf`: uændrede øvelsessæt uden løsninger.

Gamle slidekilder bevares, men renderes ikke. Den eksplicitte render- og ressourceoversigt i `src/_quarto.yml` holder dem og løsningsfiler ude af den genererede side. Freeze og kodeeksekvering er deaktiveret i de nye decks.

## Autoritet og kontrol

De oprindelige arkiver `final_lecture_notes/Kurs100_v2.zip` og `final_exercises/OS_finansiering_2026.zip` er bevaret. Den aktive bogudgave er angivet i `src/book-edition.json`; dens private LaTeX-kilder ligger i `work/troels-no-slop-2026-09-30/after_slop/`. Et fuldt build bruger denne bog og eksporterer de reviderede figurer. `--slides-only` bruger den eksisterende bog-PDF og kontrollerer dens hash. Hashes, dækningsmatricer og QA ligger lokalt i `work/final-rebuild/` og `work/troels-slides-2026-10-02/`. Arkiver og arbejdsfiler er udeladt fra Git.

PDF’er fremstilles fra den samme Reveal-HTML som browserudgaven. `scripts/validate_final.py` kontrollerer slide-ID’er, sidetal, billedreferencer, lokale links, originalhashes og at kun de tilladte PDF’er er publiceringsklare. Visuel kontrol dokumenteres separat; en bestået automatisk kontrol erstatter den ikke.

Forside og slides er gennemgået efter no-ai-slop-reglerne. Kapitel 1–8 er den 2. oktober 2026 afstemt med den reviderede bog: dagskonventioner og LIBOR, obligationskontrakten, YTM og geninvestering, PV-spænd, swapkurver, renterisiko, floaters, CPR og horisontafkast. Kapitel 4 fremhæver desuden, hvordan kupon, afdrag, løbetid og effektiv rente ændrer varigheden, med henvisning til de eksisterende ligninger og tabeller. Figurerne for YTM, prisafvigelser, kursfølsomhed og realkreditbalancen er eksporteret fra bogen. Opgaveslidene og OS1–OS5 er bevaret. Lektionsbogen har korte litteraturhenvisninger ved LIBOR, Vitec Scanrate som kilde til tabel 5.4 og årstallet 2026 på forsiden.

Undervisning: tirsdag kl. 08:15–10:00 og torsdag kl. 14:15–16:00, fra 20. oktober til 26. november 2026 (uge 43–48). Modul 1 er intro + kapitel 1, modul 2–10 følger kapitel 2–10, modul 11 er buffer den 24. november, og modul 12 bruger en tidligere eksamen som eksempel den 26. november. Datoer og tider er bekræftet af underviseren. Lokale og oplysninger om den aktuelle eksamen findes i Brightspace.

## Opdater hjemmesiden på GitHub

Siden ligger på https://lehfinancier.github.io/Finansiering-2026/ . GitHub Pages skal bruge **Deploy from a branch**, grenen **main** og mappen **/docs** under repositoryets **Settings → Pages**.

1. Rediger kilderne, og byg lokalt med kommandoerne ovenfor. Forsiden og introen genereres af `scripts/prepare_site.py`; ret deres tekst dér og kursusdata i `src/course-2026.json`.
2. Kontrollér resultatet med den lokale previewserver.
3. I Fork: vælg repositoryet og `main`, stage de færdige ændringer, skriv en commitbesked, og vælg **Commit** og **Push** til `origin/main`. Både kilderne og den opdaterede `docs/` skal med.
4. Følg publiceringen under **Actions → pages build and deployment**. Når den er grøn, genindlæs hjemmesiden, eventuelt med Ctrl+F5.

GitHub publicerer den færdigbyggede `docs/`-mappe ved push. GitHub bygger ikke selv Quarto-kilderne. Private arkiver og `work/` er ignoreret og skal ikke stages med force.
