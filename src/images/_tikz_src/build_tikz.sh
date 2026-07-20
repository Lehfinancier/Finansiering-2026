#!/usr/bin/env bash
# =====================================================================
#  build_tikz.sh — reproducible TikZ-from-notes -> slide-asset pipeline
#
#  Established in the Deck 5 pilot. Re-render an inline note TikZ figure
#  to a self-contained SVG (+ PNG fallback) for the RevealJS decks.
#
#  Route:  standalone LaTeX  ->  cropped PDF  ->  dvisvgm (--no-fonts)
#          glyphs traced to paths => no font dependency in the slide HTML.
#          PNG fallback via pdftocairo @300dpi (transparent).
#
#  Requires (all confirmed present on this machine):
#    pdflatex (TinyTeX)  +  standalone.cls
#    dvisvgm  (MiKTeX 2.11)
#    pdftocairo (MiKTeX)  [fallback only]
#
#  Usage:
#    ./build_tikz.sh <basename> [phases]
#      <basename>  a .tex here whose figure honours \phase (1..N)
#      [phases]    highest phase to build (default 1 = single, un-phased)
#  Examples:
#    ./build_tikz.sh kap5_pengestroemme 2     # 2-step build (pilot)
#    ./build_tikz.sh kap6_konverteringsmotor 6
#
#  Output lands in ../chapters/<chapterN>/ — set OUT below per figure,
#  or pass OUT=... in the environment.
# =====================================================================
set -euo pipefail
BASE="${1:?usage: build_tikz.sh <basename> [maxphase]}"
MAXP="${2:-1}"
OUT="${OUT:-../chapters/chapter_5}"      # override per chapter
mkdir -p "$OUT"

for p in $(seq 1 "$MAXP"); do
  # single-phase figures ignore \phase; multi-phase honour it via \ifnum
  job="$BASE"; [ "$MAXP" -gt 1 ] && job="${BASE}_${p}"
  echo ">> [$BASE] phase $p -> $job"
  pdflatex -interaction=nonstopmode -halt-on-error \
    -jobname="$job" "\def\phase{$p}\input{${BASE}.tex}" >/dev/null
  dvisvgm --pdf --no-fonts --output="$OUT/${job}.svg" "${job}.pdf" >/dev/null 2>&1
  pdftocairo -png -r 300 -transp -singlefile "${job}.pdf" "$OUT/${job}" || true
  echo "   -> $OUT/${job}.svg  (+ .png)"
done

# tidy LaTeX intermediates, keep only .tex sources + this script
rm -f ./*.aux ./*.log ./*.pdf
echo "done."
