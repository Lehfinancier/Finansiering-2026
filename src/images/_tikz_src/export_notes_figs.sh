#!/usr/bin/env bash
# =====================================================================
# export_notes_figs.sh - export standalone TikZ figures from the notes
#
# Route: extract tikzpicture -> standalone LaTeX -> PDF -> SVG (+ PNG)
#        pdflatex -> dvisvgm --pdf --no-fonts + pdftocairo -png
#
# Usage from this directory:
#   ./export_notes_figs.sh              # chapters 3,4,6,7,8,9,10
#   ./export_notes_figs.sh 03 04        # selected chapters
#
# Every figure gets its own wrapper. Colours are harvested from the
# chapter and figure sources; the standard scan palette is always present.
# The script continues after a figure failure and records the exact error
# in STATUS.tsv and the corresponding LaTeX log.
# =====================================================================
set -u -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../" && pwd)"
NOTES_ROOT="$REPO_ROOT/exercises_lecturenotes/lecture_notes/kurs100_lektionsnoter"
BUILD_ROOT="$SCRIPT_DIR/_build_notes_figs"
STATUS_FILE="$SCRIPT_DIR/export_status.tsv"

DEFAULT_CHAPTERS=(03 04 06 07 08 09 10)
if [[ $# -eq 0 ]]; then
  CHAPTERS=("${DEFAULT_CHAPTERS[@]}")
else
  CHAPTERS=()
  for requested in "$@"; do
    CHAPTERS+=("$(printf '%02d' "$((10#$requested))")")
  done
fi

mkdir -p "$BUILD_ROOT"
printf 'chapter\tsource\toutput\tpdflatex\tSVG\tPNG\tnote\n' > "$STATUS_FILE"

colour_lines() {
  local chapter="$1"
  local src_dir="$2"
  local chapter_file
  chapter_file="$(find "$NOTES_ROOT/Kapitler" -maxdepth 1 -type f -name "$((10#$chapter))*" -print -quit)"
  {
    printf '%s\n' \
      '\definecolor{scanpink}{HTML}{E5006D}' \
      '\definecolor{scanteal}{HTML}{00A6A6}' \
      '\definecolor{scannavy}{HTML}{243746}' \
      '\definecolor{scanlightgray}{HTML}{F1F2F3}'
    if [[ -n "$chapter_file" ]]; then
      grep -hE '^[[:space:]]*\\definecolor\{' "$chapter_file" || true
    fi
    grep -hE '^[[:space:]]*\\definecolor\{' "$src_dir"/*.tex 2>/dev/null || true
  } | sed 's/[[:space:]]*%.*$//' | awk '!seen[$0]++'
}

output_name() {
  local chapter="$1"
  local src="$2"
  case "$src" in
    fig_realkredit_balance) echo "kap5_balance" ;;
    fig_adam_balance) echo "kap9_adam_balance" ;;
    fig_securitization) echo "kap9_securitization_tranching" ;;
    fig_kap8_bondecosystem) echo "kap8_BondEcoSystem" ;;
    fig_kap5_kredittermin_oktober) echo "kap5_kredittermin" ;;
    fig_kap5_floaterfixing) echo "kap5_floaterfixing" ;;
    fig_kap5_rtlopbygning) echo "kap5_rtlopbygning" ;;
    fig_kap5_rtltriggers) echo "kap5_rtltriggers" ;;
    *) echo "${src#fig_}" ;;
  esac
}

for chapter in "${CHAPTERS[@]}"; do
  chapter="$(printf '%02d' "$((10#$chapter))")"
  src_dir="$NOTES_ROOT/tikz/kapitel$chapter"
  out_dir="$SCRIPT_DIR/../chapters/chapter_$((10#$chapter))"
  mkdir -p "$out_dir"

  if [[ ! -d "$src_dir" ]]; then
    printf '%s\t-\t-\tFAIL\tFAIL\tFAIL\tmissing source directory\n' "$chapter" >> "$STATUS_FILE"
    continue
  fi

  while IFS= read -r source_file; do
    src="$(basename "$source_file" .tex)"
    out="$(output_name "$chapter" "$src")"
    job="$chapter-$out"
    work="$BUILD_ROOT/$job"
    mkdir -p "$work"
    body="$work/body.tex"
    tex="$work/$job.tex"
    pdf="$work/$job.pdf"
    log="$work/$job.log"
    svg="$out_dir/$out.svg"
    png="$out_dir/$out.png"

    awk '/\\begin\{tikzpicture\}/{f=1} f{print} /\\end\{tikzpicture\}/{f=0}' "$source_file" > "$body"
    if ! grep -q '\\begin{tikzpicture}' "$body"; then
      printf '%s\t%s\t%s\tFAIL\tSKIP\tSKIP\tno tikzpicture block\n' "$chapter" "$src" "$out" >> "$STATUS_FILE"
      continue
    fi

    {
      cat <<'EOF'
\documentclass[border=6pt]{standalone}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[scaled=0.98]{helvet}
\renewcommand{\familydefault}{\sfdefault}
\usepackage{amsmath}
\usepackage{graphicx}
\graphicspath{{../../../../../../exercises_lecturenotes/lecture_notes/kurs100_lektionsnoter/}}
\usepackage{tikz}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\usetikzlibrary{arrows.meta, decorations.pathreplacing, calc, positioning, fit, backgrounds, shapes.geometric}
\usepgfplotslibrary{groupplots,fillbetween}
EOF
      colour_lines "$chapter" "$src_dir"
      cat <<'EOF'
\begin{document}
EOF
      cat "$body"
      cat <<'EOF'
\end{document}
EOF
    } > "$tex"

    echo "-- chapter $chapter: $src -> $out"
    if pdflatex -interaction=nonstopmode -halt-on-error -output-directory="$work" "$tex" > "$work/pdflatex.stdout" 2>&1; then
      latex_status=OK
    else
      latex_status=FAIL
    fi

    if [[ "$latex_status" != OK ]]; then
      error="$(grep -m1 -E '^!' "$log" 2>/dev/null || tail -n 3 "$work/pdflatex.stdout")"
      error="${error//$'\t'/ }"
      error="${error//$'\n'/ }"
      printf '%s\t%s\t%s\tFAIL\tSKIP\tSKIP\t%s\n' "$chapter" "$src" "$out" "$error" >> "$STATUS_FILE"
      echo "   FAIL pdflatex: $error"
      continue
    fi

    if dvisvgm --pdf --no-fonts "$pdf" -o "$svg" > "$work/dvisvgm.stdout" 2>&1; then
      svg_status=OK
    else
      svg_status=FAIL
    fi
    if pdftocairo -png -r 300 -transp -singlefile "$pdf" "$out_dir/$out" > "$work/pdftocairo.stdout" 2>&1; then
      png_status=OK
    else
      png_status=FAIL
    fi

    note=""
    if [[ "$svg_status" != OK ]]; then note="$(tail -n 1 "$work/dvisvgm.stdout" | tr '\t\n' '  ')"; fi
    if [[ "$png_status" != OK ]]; then note="${note} $(tail -n 1 "$work/pdftocairo.stdout" | tr '\t\n' '  ')"; fi
    printf '%s\t%s\t%s\tOK\t%s\t%s\t%s\n' "$chapter" "$src" "$out" "$svg_status" "$png_status" "$note" >> "$STATUS_FILE"
    echo "   pdflatex=OK svg=$svg_status png=$png_status"
  done < <(find "$src_dir" -maxdepth 1 -type f -name '*.tex' -print | sort)
done

echo "Status: $STATUS_FILE"
