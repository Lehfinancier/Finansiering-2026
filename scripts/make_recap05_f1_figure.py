"""Tegn recap-figuren for F1: låntagers rente som funktion af auktionskursen.

R = (1 + c) / k - 1 for et afdragsfrit F1-lån finansieret af én etårig stående obligation.
Skriver src/images/final/recap05-f1-rente-kurs.svg. Kræver kun standardbiblioteket.
"""
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "src/images/final/recap05-f1-rente-kurs.svg"

W, H = 700, 440
L, R, T, B = 78, 596, 26, 374          # plotområde i px
KMIN, KMAX = 97.0, 102.0               # kurs
YMIN, YMAX = -1.0, 6.5                 # rente i %
INK, TEAL, ACC, MUTED, GRID, BG = "#173545", "#007f80", "#b5522b", "#526770", "#dde3e3", "#fafaf7"
FONT = "Aptos, 'Segoe UI', sans-serif"
SERIES = [(0.01, INK, "kupon 1%"), (0.02, MUTED, "kupon 2%"), (0.03, TEAL, "kupon 3%")]


def x(k): return L + (k - KMIN) / (KMAX - KMIN) * (R - L)
def y(r): return B - (r - YMIN) / (YMAX - YMIN) * (B - T)
def rate(c, k): return ((1 + c) / (k / 100) - 1) * 100
def fmt(v): return f"{v:g}".replace(".", ",")


parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" '
         f'font-family="{FONT}" role="img" aria-label="F1-rente som funktion af auktionskursen">',
         f'<rect width="{W}" height="{H}" fill="{BG}"/>']

for r in range(-1, 7):
    parts.append(f'<line x1="{L}" x2="{R}" y1="{y(r):.1f}" y2="{y(r):.1f}" stroke="{GRID}" stroke-width="1"/>')
    parts.append(f'<text x="{L-10}" y="{y(r)+5:.1f}" font-size="18" fill="{MUTED}" text-anchor="end">{r}%</text>')
for k in range(97, 103):
    parts.append(f'<line x1="{x(k):.1f}" x2="{x(k):.1f}" y1="{B}" y2="{B+6}" stroke="{MUTED}"/>')
    parts.append(f'<text x="{x(k):.1f}" y="{B+24}" font-size="18" fill="{MUTED}" text-anchor="middle">{k}</text>')
parts.append(f'<line x1="{x(100):.1f}" x2="{x(100):.1f}" y1="{T}" y2="{B}" stroke="{MUTED}" stroke-dasharray="3 4"/>')
parts.append(f'<text x="{x(100)+6:.1f}" y="{T+14}" font-size="17" fill="{MUTED}">pari: rente = kupon</text>')
parts.append(f'<line x1="{L}" x2="{R}" y1="{B}" y2="{B}" stroke="{MUTED}"/>')
parts.append(f'<text x="{(L+R)/2}" y="{H-12}" font-size="19" fill="{INK}" text-anchor="middle">Auktionskurs på den etårige obligation</text>')
parts.append(f'<text x="18" y="{(T+B)/2}" font-size="19" fill="{INK}" text-anchor="middle" '
             f'transform="rotate(-90 18 {(T+B)/2})">Låntagers årlige rente</text>')

for c, col, label in SERIES:
    pts = " ".join(f"{x(k/10):.1f},{y(rate(c, k/10)):.1f}" for k in range(970, 1021))
    parts.append(f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-width="3"/>')
    parts.append(f'<text x="{R+8}" y="{y(rate(c, KMAX))+5:.1f}" font-size="18" fill="{col}" font-weight="600">{label}</text>')

# Samme rente med forskellig kupon: 1% til kurs 99 og 3% til kurs 101.
r1, r3 = rate(0.01, 99), rate(0.03, 101)
parts.append(f'<line x1="{x(99):.1f}" x2="{x(101):.1f}" y1="{y(r1):.1f}" y2="{y(r3):.1f}" stroke="{ACC}" stroke-width="2" stroke-dasharray="6 4"/>')
for k, r in [(99, r1), (101, r3)]:
    parts.append(f'<circle cx="{x(k):.1f}" cy="{y(r):.1f}" r="6" fill="{ACC}"/>')
parts.append(f'<text x="{L+12}" y="{y(0.55):.1f}" font-size="17" fill="{ACC}" font-weight="600">● 1% til kurs 99 og 3% til kurs 101:</text>')
parts.append(f'<text x="{L+12}" y="{y(-0.35):.1f}" font-size="17" fill="{ACC}" font-weight="600">   samme rente ≈ 2%</text>')
# Lav kurs: 1% til kurs 98.
r98 = rate(0.01, 98)
parts.append(f'<circle cx="{x(98):.1f}" cy="{y(r98):.1f}" r="6" fill="{INK}"/>')
parts.append(f'<text x="{x(98)-10:.1f}" y="{y(r98)+24:.1f}" font-size="17" fill="{INK}" text-anchor="end">kurs 98 → {fmt(round(r98, 2))}%</text>')
parts.append("</svg>")

OUT.write_text("\n".join(parts) + "\n", encoding="utf-8")
print(OUT)
