"""Build the private, presentation-friendly chapter 2 solution PDF.

Run with Python + reportlab. No website build or publication is performed.
Source: src/slides/chapters/02.qmd, exercises 2.1-2.8.
All graphs are vector graphics; calculations retain full precision.
"""
from pathlib import Path
import math
import json
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/kapitel-02-loesninger-revideret.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
for name, file in [('Arial', 'arial.ttf'), ('Arial-Bold', 'arialbd.ttf'), ('Arial-Italic', 'ariali.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts') / file)))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-Bold', italic='Arial-Italic', boldItalic='Arial-Bold')
NAVY = HexColor('#142F44')
TEAL = HexColor('#087F8C')
GOLD = HexColor('#CA7A20')
RED = HexColor('#B64949')
GRAY = HexColor('#536675')
PALE = HexColor('#EDF4F6')
GRID = HexColor('#D7E1E7')
W, H = 960, 680
c = canvas.Canvas(str(OUT), pagesize=(W, H))
c.setTitle('Kapitel 2 - Obligationer: løsninger til opgave 2.1-2.8')
c.setAuthor('Finansiering 2026 | Kurs 100')
c.setSubject('Pædagogiske løsninger med mellemregninger, figurer og Excel-formler')
page_no = 0
pages = []
checks = []

def dk(n, decimals=2):
    return f'{n:,.{decimals}f}'.replace(',', 'X').replace('.', ',').replace('X', '.')

def pct(n, decimals=2):
    return dk(100*n, decimals) + ' %'

def bond(n, r, coupon=5, principal=100):
    return sum(coupon/(1+r)**t for t in range(1, n+1)) + principal/(1+r)**n

def solve_y(price, n, coupon):
    lo, hi = -0.5, 1.0
    for _ in range(100):
        mid = (lo+hi)/2
        if bond(n, mid, coupon) > price:
            lo = mid
        else:
            hi = mid
    return (lo+hi)/2

def para(text, x, y, width=412, size=16, color=NAVY, gap=12):
    style = ParagraphStyle('p', fontName='Arial', fontSize=size, leading=size*1.35,
                           textColor=color, spaceAfter=0)
    p = Paragraph(text, style)
    _, h = p.wrap(width, 1000)
    assert y-h >= 61, f'Text overflow page {page_no}: {text[:60]} bottom={y-h}'
    p.drawOn(c, x, y-h)
    return y-h-gap

def formula(text, x, y, width=412, size=18):
    style = ParagraphStyle('formula', fontName='Arial-Bold', fontSize=size,
                           leading=size*1.4, textColor=TEAL)
    p = Paragraph(text, style)
    _, h = p.wrap(width-24, 1000)
    assert y-h-22 >= 61
    c.setFillColor(PALE)
    c.roundRect(x, y-h-22, width, h+22, 8, fill=1, stroke=0)
    p.drawOn(c, x+12, y-h-11)
    return y-h-38

def table(rows, x, y, widths, size=14):
    sty = ParagraphStyle('cell', fontName='Arial', fontSize=size, leading=size*1.25, textColor=NAVY)
    data = [[Paragraph(str(v), sty) for v in row] for row in rows]
    t = Table(data, colWidths=widths, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PALE),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, HexColor('#F7F9FA')]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 10), ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 9), ('RIGHTPADDING', (0,0), (-1,-1), 9),
        ('LINEBELOW', (0,0), (-1,0), 1, GRID),
    ]))
    _, h = t.wrap(sum(widths), 1000)
    assert y-h >= 61, f'Table overflow page {page_no}'
    t.drawOn(c, x, y-h)
    return y-h-16

def new_page(section, title, takeaway):
    global page_no
    if page_no:
        c.showPage()
    page_no += 1
    pages.append({'page': page_no, 'section': section, 'title': title})
    c.setFillColor(white)
    c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(TEAL)
    c.rect(0,H-9,W,9,fill=1,stroke=0)
    c.setFont('Arial-Bold', 12)
    c.drawString(48, H-40, section.upper())
    para(title, 48, H-62, 864, 28, gap=0)
    para(takeaway, 48, H-108, 864, 15, GRAY, gap=0)
    c.setStrokeColor(GRID)
    c.line(48, 52, 912, 52)
    c.setFillColor(GRAY)
    c.setFont('Arial', 10)
    c.drawString(48, 32, 'FINANSIERING 2026  /  KAPITEL 2  /  LØSNINGER')
    c.drawRightString(912, 32, str(page_no))
    c.bookmarkPage(f'p{page_no}')
    c.addOutlineEntry(f'{section}: {title}', f'p{page_no}', level=0)

def label(text, x, y, size=11, color=GRAY, align='left'):
    c.setFont('Arial', size)
    c.setFillColor(color)
    {'left':c.drawString, 'right':c.drawRightString, 'center':c.drawCentredString}[align](x,y,text)

def plot(series, xmin, xmax, ymin, ymax, xticks, yticks, xlabel, ylabel,
         x=500, y=283, width=412, height=255, percent_y=False):
    left, bottom = x+51, y+43
    pw, ph = width-67, height-76
    def tx(v): return left+(v-xmin)/(xmax-xmin)*pw
    def ty(v): return bottom+(v-ymin)/(ymax-ymin)*ph
    label(ylabel, x, y+height-6, 12, NAVY)
    for v in yticks:
        c.setStrokeColor(GRID); c.setLineWidth(.6)
        c.line(left,ty(v),left+pw,ty(v))
        label(dk(v,0)+(' %' if percent_y else ''), left-7,ty(v)-4,10,align='right')
    for v in xticks:
        label(dk(v,0),tx(v),bottom-17,10,align='center')
    label(xlabel, left+pw/2,y+5,11,align='center')
    for xs, ys, name, color in series:
        c.setStrokeColor(color); c.setLineWidth(2.5)
        path=c.beginPath(); path.moveTo(tx(xs[0]),ty(ys[0]))
        for a,b in zip(xs[1:],ys[1:]): path.lineTo(tx(a),ty(b))
        c.drawPath(path)
        if len(xs)<=12:
            c.setFillColor(color)
            for a,b in zip(xs,ys): c.circle(tx(a),ty(b),3.1,fill=1,stroke=0)
    for i, (_,_,name,color) in enumerate(series):
        label(name,x+i*140,y-13,11,color)

def bars(groups, series, ylabel, ymax, x=500,y=283,width=412,height=255):
    left,bottom=x+53,y+43
    pw,ph=width-69,height-75
    label(ylabel,x,y+height-6,12,NAVY)
    for i in range(5):
        v=ymax*i/4
        c.setStrokeColor(GRID); c.setLineWidth(.6)
        c.line(left,bottom+ph*i/4,left+pw,bottom+ph*i/4)
        label(dk(v,0),left-7,bottom+ph*i/4-4,10,align='right')
    step=pw/len(groups); bw=min(46,step*.62)
    for j,g in enumerate(groups):
        base=0
        for values,name,color in series:
            value=values[j]
            c.setFillColor(color)
            c.rect(left+j*step+(step-bw)/2,bottom+base/ymax*ph,bw,value/ymax*ph,fill=1,stroke=0)
            base+=value
        label(str(g),left+(j+.5)*step,bottom-18,11,align='center')
    for i,(_,name,color) in enumerate(series): label(name,x+i*150,y-8,11,color)

H0=2_000_000
A=H0*.05/(1-1.05**-4)
ann=[]; remaining=H0
for t in range(1,5):
    interest=.05*remaining; repayment=A-interest
    ann.append((t,remaining,interest,repayment,A,remaining-repayment))
    remaining-=repayment
ser=[(t,H0-(t-1)*500000,.05*(H0-(t-1)*500000),500000,500000+.05*(H0-(t-1)*500000),H0-t*500000) for t in range(1,5)]
y0=(100/90.57)**.2-1
y3=solve_y(96.37,4,3)
fv6=1e6+60000*(1.06**2+1.06+1)
fv2=1e6+60000*(1.02**2+1.02+1)
ret2=(fv2/1e6)**(1/3)-1

new_page('Løsningshæfte', 'Obligationer - forstå tallene, før du taster',
         'Opgave 2.1-2.8 fra slidesættet til kapitel 2 • Finansiering på HA.jur.')
y=para('En obligation er en række betalinger på bestemte tidspunkter.',48,530,864,27)
y=para('Når du kan tegne betalingerne, kan du forklare både prisen, den effektive rente og risikoen. Excel hjælper med regnearbejdet; tidslinjen hjælper med at forstå svaret.',48,y,800,19)
table([['Først','Dernæst','Til sidst'],['Hvad betales - og hvornår?','Hvad er betalingerne værd på samme dato?','Giver svaret økonomisk mening?']],48,365,[288]*3,17)
para('<b>Sådan bruges hæftet</b><br/>Hver delopgave har en forklaring og et svar. Mellemregningerne viser vejen, og Excel-boksene kan bruges til at genskabe tallene. Figurer og tabeller bygger på opgavernes egne data.',48,230,550,16)
para('<b>Fælles forudsætninger</b><br/>Aftalte betalinger gennemføres. Ingen skat eller handelsomkostninger. Ved hele år regnes fra en terminsdag umiddelbart efter betaling.',640,230,272,14)

new_page('Overblik', 'Find opgaven - og hold styr på enhederne', 'Priser pr. 100 nominel kaldes kurser. Kronebeløb kræver også en hovedstol.')
table([['Opgave','Emne','Side'],['2.1 (a-d)','Annuitet, serie og stående lån','3-5'],['2.2 (a-d)','Nulkupon, kursværdi og tid','6-7'],['2.3 (a-c)','Effektiv rente og rentetilskrivning','8-9'],['2.4 (a-d)','Valør, vedhængende rente og afregning','10-11'],['2.5 (a-d)','Discount, pari, præmie og pull-to-par','12-13'],['2.6 (a-d)','Geninvestering og realiseret afkast','14-15'],['2.7 (a-d)','Løbetid, prisfølsomhed og krumning','16-17'],['2.8 (a-c)','Læs en kursliste','18-19'],['Excel','En model, du selv kan bygge','20']],48,530,[98,280,56],13)
y=formula('Kursværdi = nominel beholdning × kurs / 100',520,530,392,20)
y=para('<b>Tre kontroller før du regner</b><br/>1. Er beløbet kroner eller kurspoint?<br/>2. Er renten pr. år eller pr. termin?<br/>3. Er prisen clean eller dirty?',520,y,392,17)
y=para('<b>Afrunding</b><br/>Der regnes med fuld præcision undervejs. Tabeller afrundes ved visning. Derfor kan en sum af viste tal afvige med en øre eller en krone.',520,y,392,15)
para('<b>Excel i hæftet</b><br/>De fleste formler bruger kun +, -, *, / og ^. De virker derfor også uden at oversætte funktionsnavne. Brug komma som decimaltegn i dansk Excel.',520,y,392,15)

new_page('2.1 (a)', 'Annuitetslånet: ydelsen er den samme hvert år', 'Givet: 2.000.000 kr., fire år, 5 % årlig rente og én betaling ved slutningen af hvert år.')
y=para('Den faste ydelse dækker renter og afdrag. Formlen findes ved at sætte nutidsværdien af de fire ens ydelser lig hovedstolen. Dermed er gælden betalt efter fjerde ydelse.',48,530)
y=formula('Y = H × r / (1 - (1+r)<super>-n</super>)<br/>= 2.000.000 × 0,05 / (1 - 1,05<super>-4</super>)<br/>= '+dk(A)+' kr. ≈ 564.024 kr.',48,y,size=17)
y=para('<b>År 1, trin for trin</b><br/>Rente = 2.000.000 × 5 % = 100.000 kr.<br/>Afdrag = '+dk(A)+' - 100.000 = '+dk(A-100000)+' kr.<br/>Restgæld = 2.000.000 - '+dk(A-100000)+' = '+dk(2100000-A)+' kr.',48,y,size=15)
para('<b>Excel:</b> <font color="#087F8C">=2000000*5%/(1-(1+5%)^(-4))</font><br/>Behold alle decimaler i ydelsescellen.',48,y,size=14)
bars(['År 1','År 2','År 3','År 4'],[([r[3]/1000 for r in ann],'Afdrag',TEAL),([r[2]/1000 for r in ann],'Rente',GOLD)],'Årlig ydelse, 1.000 kr.',600)
para('<b>Læs grafen:</b> Søjlerne er lige høje. Renten fylder mindre, fordi der betales af på gælden. Derfor bliver der plads til et større afdrag inden for samme ydelse.',500,236,size=16)

new_page('2.1 (a-b)', 'Betalingsrækker: rente regnes af gælden før betaling', 'Alle beløb er i kroner og vises her afrundet til hele kroner. Beregningerne bruger uafrundede tal.')
rows=[['År','Restgæld før','Rente','Afdrag','Ydelse','Restgæld efter']]
para('<b>(a) Annuitetslån</b> - fast ydelse på '+dk(A)+' kr.',48,536,864,16)
table(rows+[[str(r[0])]+[dk(v,0) for v in r[1:]] for r in ann],48,503,[48,174,138,162,160,182],14)
para('<b>(b) Serielån</b> - fast afdrag: 2.000.000 / 4 = 500.000 kr. om året.',48,283,864,16)
table(rows+[[str(r[0])]+[dk(v,0) for v in r[1:]] for r in ser],48,250,[48,174,138,162,160,182],14)

new_page('2.1 (b-d)', 'Tidlige afdrag ændrer, hvor risikoen ligger', 'Samme hovedstol og kuponrente giver forskellige tidspunkter for tilbagebetalingen.')
y=para('<b>(b) Serie:</b> År 2 starter med 1.500.000 kr. i gæld. Rente = 1.500.000 × 5 % = 75.000 kr. Ydelse = 500.000 + 75.000 = <b>575.000 kr.</b>',48,530)
y=para('<b>(c) Stående lån:</b> Der afdrages først ved udløb. Rente hvert år = 2.000.000 × 5 % = 100.000 kr.',48,y)
y=table([['År','1','2','3','4'],['Ydelse, kr.','100.000','100.000','100.000','2.100.000']],48,y,[67,79,79,79,108],12)
y=para('<b>(d) Hovedstolen kommer hurtigst tilbage i serielånet, dernæst i annuitetslånet og sidst i det stående lån.</b>',48,y,size=16)
para('Ved samme effektive rente har det stående lån størst prisfølsomhed; serielånet mindst. Flere tidlige betalinger giver til gengæld mere, der skal genplaceres frem til en fælles horisont på fire år.',48,y,size=15)
plot([([0,1,2,3,4],[2000]+[max(0,r[5]/1000) for r in ann],'Annuitet',TEAL),([0,1,2,3,4],[2000,1500,1000,500,0],'Serie',GOLD),([0,1,2,3,4],[2000,2000,2000,2000,0],'Stående',NAVY)],0,4,0,2000,[0,1,2,3,4],[0,500,1000,1500,2000],'År efter lånets start','Restgæld efter betaling, 1.000 kr.')
para('Punkterne viser gælden umiddelbart efter hver termin; linjerne forbinder observationerne. Gælden afdrages på terminsdatoerne.',500,235,size=14)
para('<b>Husk forskellen:</b> Prisrisiko handler om værdien af de betalinger, der stadig ligger ude i fremtiden. Genplaceringsrisiko handler om renten på de penge, du allerede har fået tilbage.',500,161,size=15)

new_page('2.2 (a-b)', 'Nulkupon: hele afkastet ligger i vejen fra 90,57 til 100', 'Givet: fem år til udløb, hovedstol 100 og kurs 90,57. Ingen løbende kuponer.')
y=para('<b>(a)</b> Du betaler 90,57 nu og får 100 om fem år. Den effektive rente er den årlige vækst, der forbinder de to beløb.',48,530)
y=formula('90,57 × (1+y)<super>5</super> = 100<br/>y = (100 / 90,57)<super>1/5</super> - 1<br/>= '+pct(y0,5)+' ≈ 2,00 %',48,y)
y=para('Man kan ikke blot dele den samlede procentgevinst med fem: der er renters rente. Kontrol: 90,57 × (1+y)<super>5</super> = 100.',48,y,size=16)
para('<b>Excel:</b><br/><font color="#087F8C">=(100/90,57)^(1/5)-1</font><br/>Formatér resultatcellen som procent.',48,y,size=15)
table([['(b) Nominel beholdning','250.000 kr.'],['Pris pr. 100 nominel','90,57'],['Kursværdi','250.000 × 90,57 / 100'],['Svar','226.425,00 kr.']],500,530,[211,201],16)
para('<b>Hvorfor clean = dirty?</b><br/>Der er ingen kupon, som skal fordeles mellem sælger og køber. Vedhængende rente er derfor nul.',500,291,size=17)
para('Obligationen giver stadig et afkast. Det ligger i forskellen mellem købsprisen og indfrielsen på 250.000 kr. - ikke i en kuponbetaling undervejs.',500,173,size=16)

new_page('2.2 (c-d)', 'Et rentestød og to års ventetid er to forskellige forsøg', 'I (c) ændrer vi renten med fem år tilbage. I (d) lader vi tiden gå med uændret rente.')
y=para('<b>(c) Renten stiger til 3 %</b>',48,530)
y=formula('Ny kurs = 100 / 1,03<super>5</super> = '+dk(100/1.03**5),48,y)
y=para('En ny, sammenlignelig investering giver nu et højere afkast. De samme 100 kr. om fem år kan derfor kun konkurrere, hvis købsprisen falder. Kursfald: '+dk(100/1.03**5-90.57)+' kurspoint.',48,y)
y=para('<b>(d) To år går; renten er uændret</b>',48,y)
y=formula('Kurs med 3 år tilbage = 100 / (1+y)<super>3</super><br/>= '+dk(100/(1+y0)**3),48,y,size=17)
para('<b>Pull-to-par:</b> De 100 kr. er kommet tættere på. Ved positiv, uændret rente stiger kursen mod 100. Brug den uafrundede rente fra (a).',48,y,size=15)
plot([([i/10 for i in range(51)],[100/(1+y0)**(5-i/10) for i in range(51)],'Uændret rente ≈ 2 %',TEAL)],0,5,85,100,[0,1,2,3,4,5],[85,90,95,100],'År siden køb','Kurs pr. 100 nominel')
table([['Scenarie','År tilbage','Kurs'],['Ved købet','5','90,57'],['Renten stiger til 3 %','5',dk(100/1.03**5)],['To år senere, rente fra (a)','3',dk(100/(1+y0)**3)]],500,231,[230,90,92],12)

new_page('2.3 (a-b)', 'Effektiv rente prissætter alle fire betalinger', 'Givet: fireårig stående obligation, 3 % årlig kupon, hovedstol 100 og kurs 96,37.')
y=para('<b>(a)</b> Betalingerne er 3, 3, 3 og 103. Sidste betaling indeholder både den sidste kupon og hovedstolen.',48,530)
y=formula('96,37 = 3/(1+y) + 3/(1+y)<super>2</super><br/>+ 3/(1+y)<super>3</super> + 103/(1+y)<super>4</super>',48,y,size=17)
y=para('Ved indsættelse af y = 4 % bliver nutidsværdierne som i tabellen. Summen er '+dk(bond(4,.04,3),5)+', som afrundes til <b>96,37</b>.',48,y)
y=para('<b>Afrundingsdetaljen:</b> Løses ligningen med præcis 96,37, fås '+pct(y3,5)+'. Opgavens 4,00 % er dermed korrekt med den viste præcision.',48,y,size=15)
para('<b>(b)</b> Kuponen giver 3 pr. år, og investor får desuden en kursgevinst fra 96,37 til 100. Derfor er den effektive rente <b>højere end 3 %</b>.',48,y,size=16)
table([['År','Betaling','Division ved 4 %','Værdi i dag']]+[[str(t),str(3 if t<4 else 103),'1,04'+['','²','³','⁴'][t-1],dk((3 if t<4 else 103)/1.04**t,4)] for t in range(1,5)]+[['Sum','','',dk(bond(4,.04,3),4)]],500,530,[60,85,127,140],14)
para('<b>Excel uden specialfunktioner:</b><br/>Læg y i B1. Beregn summen med<br/><font color="#087F8C">=3/(1+B1)+3/(1+B1)^2<br/>+3/(1+B1)^3+103/(1+B1)^4</font><br/>Brug Målsøgning: sæt summen til 96,37 ved at ændre B1.',500,235,size=15)

new_page('2.3 (c)', 'Fire gange 1 % giver lidt mere end 4 %', 'Givet: nominel årlig rente 4 % med fire rentetilskrivninger om året.')
y=para('<b>Rente pr. termin</b><br/>Den nominelle årlige rente fordeles på fire terminer.',48,530)
y=formula('r<sub>termin</sub> = 4 % / 4 = 1 %<br/>r<sub>effektiv, år</sub> = (1 + 0,04/4)<super>4</super> - 1<br/>= 4,060401 % ≈ 4,06 %',48,y)
y=para('100 kr. vokser først til 101 kr. Næste kvartal tilskrives der også rente af den første rente. Det er årsagen til de ekstra 0,060401 procentpoint.',48,y)
y=para('<b>Kan de to 4 %-satser sammenlignes direkte?</b><br/>Nej. Den første er effektiv årlig rente. Den anden er nominel årlig rente med kvartalsvis tilskrivning. Omregn til samme effektive årsrente.',48,y,size=16)
para('<b>Excel:</b> <font color="#087F8C">=(1+4%/4)^4-1</font>',48,y,size=15)
table([['Kvartal','Beregning','Saldo af 100 kr.']]+[[str(t),'100 × 1,01'+['','²','³','⁴'][t-1],dk(100*1.01**t,4)] for t in range(1,5)],500,530,[78,170,164],15)
para('<b>Sammenligning på samme grundlag</b><br/>4,00 % effektivt årligt: 100 bliver til 104.<br/>4,00 % nominelt med fire terminer: 100 bliver til 104,060401.',500,260,size=17)
para('Rentekonventionen er en del af oplysningen. Et procenttal uden periode og tilskrivningsregel er ikke nok.',500,145,size=16)

new_page('2.4 (a-b)', 'Vedhængende rente fordeler den næste kupon', 'Givet: 1.000.000 kr. nominel, 2 % årlig kupon, fire terminer, 50 af 90 dage gået.')
y=para('<b>(a) Handelsdag:</b> Den dag, hvor køber og sælger aftaler handlen.<br/><b>Valørdag:</b> Den dag, hvor penge og obligation udveksles.',48,530)
y=para('Renten fordeles frem til valør, fordi det er afregningsdagen. Køber modtager næste kupon og kompenserer sælger for den optjente del.',48,y)
y=formula('(b) Kupon pr. termin = 1.000.000 × 2 % / 4<br/>= 5.000 kr.<br/>Vedhængende rente = 5.000 × 50/90<br/>= 2.777,78 kr.',48,y,size=17)
para('<b>I kurspoint:</b> 2.777,777… / 1.000.000 × 100 = <b>0,277778</b>.<br/>Vi bruger opgavens forløbne andel 50/90 af en regelmæssig kuponperiode.',48,y,size=15)
bars(['Kupon på 5.000 kr.'],[([5000*50/90],'Sælgers 50 dage',TEAL),([5000*40/90],'Købers 40 dage',GOLD)],'Fordeling af næste kupon, kr.',6000)
y=para('Sælgers andel: <b>2.777,78 kr.</b><br/>Købers andel: <b>2.222,22 kr.</b><br/>Køber får hele kuponen, men betaler sælgers andel ved handlen.',500,248,size=16)
para('<b>Excel:</b><br/><font color="#087F8C">=1000000*2%/4*50/90</font><br/>Husk at dele den årlige kupon med fire.',500,y,size=14)

new_page('2.4 (c-d)', 'Dirty price er det beløb, der afregnes', 'Givet: clean kurs 98,45. Afregning vises uden kurtage og andre handelsomkostninger.')
table([['(c) Prisdel','Kroner','Kurspoint'],['Clean: 1.000.000 × 98,45 / 100','984.500,00','98,450000'],['Vedhængende rente','2.777,78','0,277778'],['Dirty: clean + vedhængende','987.277,78','98,727778']],48,530,[240,100,104],14)
y=para('<b>(d) Det rigtige i udsagnet:</b><br/>Vedhængende rente vokser frem mod terminen og falder til nul, når kuponen udbetales. Alt andet lige giver det et fald i dirty price omkring betalingen.',48,312,444,16)
para('<b>Det forkerte:</b><br/>Køber du efter terminen, får du heller ikke den kupon, der netop er udbetalt. Den lavere pris er derfor ikke i sig selv en besparelse. Markedsrenten kan samtidig flytte kursen.',48,y,444,16)
xs=[0,30,60,89.999,90,120,150,179.999,180]
ys=[98.45+.5*(v%90)/90 for v in xs]
plot([(xs,ys,'Dirty (illustration)',TEAL),([0,180],[98.45,98.45],'Clean (holdt fast)',GOLD)],0,180,98.4,99,[0,90,180],[98.4,98.6,98.8,99],'Dage; termin ved dag 90 og 180','Kurs, stiliseret forløb',x=520,width=392)
# Add readable decimal labels for the narrow price axis on this particular plot.
c.setFillColor(white); c.rect(520,321,45,195,fill=1,stroke=0)
for v in [98.4,98.6,98.8,99]:
    label(dk(v,1),564,326+(v-98.4)/.6*179-4,10,align='right')
para('<b>Omkring kuponbetalingen:</b><br/>Før: dirty ≈ clean + 0,50.<br/>Efter: dirty ≈ clean; investor har fået 0,50 kontant pr. 100 nominel.',520,230,392,16)
para('Grafen isolerer kuponmekanikken med fast clean kurs. Den er ikke en prognose for den faktiske markedspris.',520,124,392,13)

new_page('2.5 (a-b)', 'Den samme kupon kan være attraktiv eller utilstrækkelig', 'Givet: seksårig stående obligation, hovedstol 100 og kupon 5 pr. år.')
y=formula('P = 5 × [1 - (1+y)<super>-6</super>] / y<br/>+ 100 / (1+y)<super>6</super>',48,530,size=19)
y=table([['(a) y','PV af kuponer','PV af 100','Kurs / type']]+[[pct(r,0),dk(sum(5/(1+r)**t for t in range(1,7))),dk(100/(1+r)**6),dk(bond(6,r))+' / '+name] for r,name in [(.04,'præmie'),(.05,'pari'),(.06,'discount')]],48,y,[54,118,102,138],13)
y=para('<b>Mellemregning ved 6 %:</b><br/>5 × [1 - 1,06<super>-6</super>] / 0,06 + 100 / 1,06<super>6</super><br/>= '+dk(sum(5/1.06**t for t in range(1,7)))+' + '+dk(100/1.06**6)+' = <b>'+dk(bond(6,.06))+'</b>.',48,y,size=15)
para('<b>Excel ved 6 %:</b><br/><font color="#087F8C">=5*(1-(1+6%)^(-6))/6%+100/(1+6%)^6</font>',48,y,size=14)
rates=[.01+i*.001 for i in range(91)]
plot([([r*100 for r in rates],[bond(6,r) for r in rates],'6 år, kupon 5 %',TEAL)],1,10,75,125,[1,3,5,7,10],[75,100,125],'Effektiv årlig rente, %','Kurs pr. 100 nominel')
para('<b>(b) Markedets logik:</b><br/>Når nye obligationer giver 6 %, er kuponen på 5 % for lav til kurs 100. Kursen må ned. Giver nye obligationer 4 %, er den gamle kupon attraktiv, og kursen kommer over 100.',500,235,size=16)
para('Sammenhængen gælder den faste betalingsrække med indfrielse til pari og samme rentekonvention.',500,108,size=13)

new_page('2.5 (c-d)', 'Pull-to-par gør ikke en lav kurs til et kvalitetsstempel', 'Forløbene sammenlignes på terminsdage umiddelbart efter kuponbetaling.')
y=para('<b>(c) Tre år tilbage, stadig 6 % rente</b>',48,530)
y=formula('P = 5/1,06 + 5/1,06<super>2</super> + 105/1,06<super>3</super><br/>= '+dk(bond(3,.06)),48,y,size=17)
y=para('Kursen er steget fra '+dk(bond(6,.06))+' til '+dk(bond(3,.06))+'. <b>Pull-to-par</b> opstår, fordi der er færre år med en kupon under markedsrenten, og indfrielsen til 100 er tættere på.',48,y)
y=para('<b>(d) Er kurs 95 bedre end kurs 105?</b><br/>For præcis samme fremtidige betalinger på samme dato er 95 billigere og giver højere effektiv rente. Men kurser fra forskellige tidspunkter afspejler også forskellige markedsrenter.',48,y,size=16)
para('Sammenlign effektiv rente med alternativer med samme risiko, løbetid og rettigheder. Kursen alene fortæller ikke, om obligationen er attraktiv. En høj kupon kan retfærdiggøre en pris over 100.',48,y,size=15)
plot([([0,1,2,3,4,5,6],[bond(6-t,r) if t<6 else 100 for t in range(7)],name,color) for r,name,color in [(.04,'y = 4 %',GOLD),(.05,'y = 5 %',GRAY),(.06,'y = 6 %',TEAL)]],0,6,94,106,[0,1,2,3,4,5,6],[94,98,102,106],'År siden start','Kurs ved uændret rente')
para('Hver kurve holder sin rente fast. Slutpunktet 100 viser indfrielsesværdien; efter selve indfrielsen eksisterer obligationen ikke længere.',500,230,size=15)
para('<b>Hold to ting adskilt:</b><br/>At tiden går, flytter os langs en kurve. At renten ændres, flytter os mellem kurverne.',500,144,size=16)

new_page('2.6 (a-b)', 'Følg hver kupon helt frem til år 3', 'Givet: 1.000.000 kr. investeret til pari, tre år, 6 % kupon. Årlig kupon = 60.000 kr.')
para('Den første kupon kan forrentes i to år, den anden i ét år, og den sidste i nul år.',48,530,864,18)
table([['Modtages','Betaling','År til genplacering','(a) Slutværdi ved 6 %','(b) Slutværdi ved 2 %'],['År 1','60.000','2','60.000 × 1,06² = 67.416','60.000 × 1,02² = 62.424'],['År 2','60.000','1','60.000 × 1,06 = 63.600','60.000 × 1,02 = 61.200'],['År 3','60.000','0','60.000','60.000'],['År 3, hovedstol','1.000.000','0','1.000.000','1.000.000'],['Slutformue','','','1.191.016 kr.','1.183.624 kr.']],48,478,[128,110,153,237,236],15)
y=formula('(a) 1.000.000 + 60.000 × (1,06² + 1,06 + 1)<br/>= 1.191.016 = 1.000.000 × 1,06³',48,198,864,18)
para('<b>(b)</b> Ved 2 % genplacering bliver slutformuen <b>1.183.624 kr.</b> Det er 7.392 kr. mindre. Obligationens kuponer og hovedstol er de samme; forskellen kommer alene fra renten på de genplacerede kuponer.',48,y,864,16)

new_page('2.6 (c-d)', 'YTM ved købet og afkast af slutformuen er forskellige mål', 'YTM beskriver pris og betalinger. Det realiserede afkast her måles fra køb til samlet slutformue.')
y=para('<b>(c) Hvilken fast årsrente skaber den faktiske slutformue?</b>',48,530)
y=formula('1.000.000 × (1+R)<super>3</super> = 1.183.624<br/>R = (1.183.624 / 1.000.000)<super>1/3</super> - 1<br/>= '+pct(ret2,4)+' ≈ '+pct(ret2),48,y,size=18)
y=para('Afkastet bliver '+dk((.06-ret2)*100,4)+' procentpoint lavere end de 6 % ved købet. Den oprindelige effektive rente er stadig 6 %; den defineres af købsprisen og obligationens betalinger.',48,y,size=16)
para('<b>Excel:</b><br/><font color="#087F8C">=(1183624/1000000)^(1/3)-1</font><br/>Genplaceringsrenten 2 % gælder kuponerne, ikke hele millionen.',48,y,size=15)
y=para('<b>(d) De to centrale forudsætninger</b><br/>1. Obligationen beholdes til udløb.<br/>2. Alle mellemliggende betalinger kan genplaceres til den effektive rente fra købet.',500,530,size=17)
y=para('Desuden forudsættes, som i hele opgaven, at de aftalte betalinger modtages, og at vi ser bort fra skat og omkostninger.',500,y,size=15)
y=table([['Profil','Hvad skal genplaceres frem til udløb?'],['Nulkupon','Intet: hele betalingen kommer ved udløb'],['Stående lån','Kuponerne'],['Serie / annuitet','Både kuponer og løbende afdrag']],500,y,[130,282],14)
para('Sammenlign afdragsprofiler ved <b>samme hovedstol, kupon, løbetid og horisont ved udløb</b>. Flere tidlige betalinger giver større eksponering mod genplaceringsrenten. Højere kupon øger også eksponeringen, alt andet lige.',500,y,size=15)

new_page('2.7 (a-b)', 'En lang nulkupon er langt mere rentefølsom', 'Givet: K betaler 100 om to år. L betaler 100 om 20 år. Udgangspunktet er 4 % effektiv rente.')
y=formula('(a) P = 100 / (1+y)<super>n</super><br/>K ved 4 %: 100 / 1,04² = '+dk(100/1.04**2)+'<br/>L ved 4 %: 100 / 1,04<super>20</super> = '+dk(100/1.04**20),48,530,size=18)
y=table([['Effektiv rente','K: 2 år','L: 20 år']]+[[pct(r,0),dk(100/(1+r)**2),dk(100/(1+r)**20)] for r in [.02,.04,.06]],48,y,[160,126,126],16)
y=para('<b>(b) Procentændring = (ny kurs / gammel kurs - 1) × 100 %.</b><br/>Brug 4 %-kursen som udgangspunkt i begge retninger og behold de uafrundede kurser.',48,y,size=16)
para('For L ved rentestigning:<br/>('+dk(100/1.06**20,5)+' / '+dk(100/1.04**20,5)+' - 1) × 100 %<br/>= <b>'+pct((1.04/1.06)**20-1)+'</b>.',48,y,size=15)
rs=[.01+i*.001 for i in range(71)]
plot([([r*100 for r in rs],[100/(1+r)**n for r in rs],name,color) for n,name,color in [(2,'K: 2 år',GOLD),(20,'L: 20 år',TEAL)]],1,8,20,100,[2,4,6,8],[20,40,60,80,100],'Effektiv årlig rente, %','Kurs pr. 100 nominel')
table([['(b) Renteændring','K','L'],['4 % til 6 %',pct((1.04/1.06)**2-1),pct((1.04/1.06)**20-1)],['4 % til 2 %',pct((1.04/1.02)**2-1),pct((1.04/1.02)**20-1)]],500,237,[194,109,109],14)
para('L diskonteres over 20 år. En ændring af den årlige rente virker derfor gennem langt flere perioder.',500,104,size=14)

new_page('2.7 (c-d)', 'Lige store rentestød giver ikke lige store kursudsving', 'Renten flyttes ±2 procentpoint fra 4 %. Gevinst og tab måles fra den samme startkurs.')
p20=100/1.04**20; gain=100/1.02**20-p20; loss=p20-100/1.06**20
y=table([['(c) Obligation L','Kurs','Ændring fra 4 %'],['Ved 4 %',dk(p20),'Udgangspunkt'],['Ved 2 %',dk(100/1.02**20),'+'+dk(gain)+' point'],['Ved 6 %',dk(100/1.06**20),'-'+dk(loss)+' point']],48,530,[164,90,158],15)
y=para('Gevinsten på '+dk(gain)+' kurspoint er større end tabet på '+dk(loss)+' kurspoint. Det svarer til <b>+'+pct((1.04/1.02)**20-1)+'</b> mod <b>'+pct((1.04/1.06)**20-1)+'</b>.',48,y,size=16)
y=formula('PV = CF / (1+y)<super>t</super>',48,y)
para('Når renten falder, får den fjerne betaling mere værdi, og kurven bliver stejlere. Når renten stiger, er betalingen allerede kraftigere diskonteret, og kurven bliver fladere. Derfor er pris-rente-kurven konveks.',48,y,size=16)
y=para('<b>(d) Varighed: hvor stejl er kurven?</b><br/>Modificeret varighed beskriver den omtrentlige procentvise kursændring ved en lille ændring i renten. Jo større varighed, desto større lokal prisfølsomhed.',500,530,size=17)
y=para('<b>Konveksitet: hvor meget krummer kurven?</b><br/>Den beskriver, hvordan hældningen ændres, når renten ændres. Den forklarer, hvorfor lige store rentefald og rentestigninger giver forskellige kursudsving.',500,y,size=17)
y=formula('For L ved 4 %:<br/>Modificeret varighed = 20 / 1,04 ≈ 19,23<br/>Lille rentestigning på 0,01 procentpoint:<br/>Kursændring ≈ -19,23 × 0,0001<br/>= -0,1923 %',500,y,size=16)
para('Macaulay-varigheden for L er 20 år. Eksemplet med modificeret varighed er en bro til kapitel 4; store rentestød kræver hensyn til krumningen.',500,y,size=13)

new_page('2.8 (a-b)', 'Samme årlige kupon betyder ikke samme terminsbetaling', 'Givet: X har kurs 101,20, kupon 3 % og én termin. Y har kurs 99,10, kupon 3 % og fire terminer.')
y=formula('(a) Y betaler pr. termin:<br/>100 × 3 % / 4 = 0,75<br/>pr. 100 nominel',48,530,size=21)
y=para('Y betaler 0,75 fire gange om året. De ordinære kuponer summerer til 3,00 pr. år pr. 100 nominel.',48,y,size=18)
y=table([['','X','Y'],['Terminer pr. år','1','4'],['Kupon pr. termin','3,00','0,75'],['Kuponer pr. år i alt','3,00','3,00']],48,y,[188,112,112],15)
para('Tidligere kuponer kan genplaceres tidligere. Derfor skal afkast sammenlignes med samme rentetilskrivning.',48,y,size=16)
y=para('<b>(b) Svaret er Y.</b><br/>Under den simple antagelse om en fast betalingsrække med indfrielse til 100 giver kursen 99,10 både kuponer og en kursgevinst frem til indfrielsen.',500,530,size=18)
y=para('Y har derfor en effektiv terminsrente over 0,75 %. Den effektive årlige rente er dermed over (1 + 0,0075)<super>4</super> - 1 = <b>'+pct(1.0075**4-1,4)+'</b>, altså også over 3 %.',500,y,size=17)
y=para('X ligger over pari. Med én årlig termin bliver den effektive årlige rente derfor under 3 %, fordi investor betaler en præmie, som ikke tilbagebetales ved indfrielsen.',500,y,size=16)
para('Den præcise effektive rente kan ikke findes ud fra kurslisten alene: restløbetid, betalingsprofil og valør mangler. Vi bruger kapitlets almindelige pari-sammenligning og sammenlignelige vilkår.',500,y,size=14)

new_page('2.8 (c)', 'Kurslisten giver kursværdien - ikke altid hele regningen', 'Investor køber 300.000 kr. nominel af X til clean kurs 101,20.')
y=formula('Kursværdi = 300.000 × 101,20 / 100<br/>= 303.600 kr.',48,530,size=22)
y=para('Du køber en nominel hovedstol på 300.000 kr. Prisen er højere end hovedstolen, fordi kursen er over 100.',48,y,size=18)
y=para('<b>Er det også afregningsbeløbet?</b><br/>Kun hvis den vedhængende rente er nul, og der ikke er handelsomkostninger. Mellem terminer skal sælgers optjente rente normalt lægges oveni.',48,y,size=18)
para('<b>Excel:</b><br/><font color="#087F8C">=300000*101,20/100</font>',48,y,size=17)
y=table([['Prisdel','Beløb'],['Clean kursværdi','303.600 kr.'],['Vedhængende rente','Afhænger af valør'],['Dirty afregningsbeløb','303.600 kr. + vedhængende rente']],500,530,[190,222],17)
y=para('Den årlige kupon er 300.000 × 3 % = <b>9.000 kr.</b> Hvis f er den optjente andel af kuponperioden, bliver:',500,y,size=17)
y=formula('Vedhængende rente = 9.000 × f<br/>Afregning = 303.600 + 9.000 × f',500,y,size=18)
para('Opgaven oplyser ikke valør eller den forløbne andel. Derfor kan vi ikke sætte et præcist tal på afregningen. Her er et udtryk det fulde svar.',500,y,size=16)

new_page('Excel-værksted', 'Byg betalingsrækken, så du kan se, hvad Excel regner', 'Eksempel: opgave 2.1 (a). Brug én række pr. termin og bevar fuld præcision i cellerne.')
table([['Inputcelle','Indhold'],['B1','2000000 (hovedstol)'],['B2','5% (rente pr. år)'],['B3','4 (antal år)'],['B4','=B1*B2/(1-(1+B2)^(-B3))']],48,530,[102,310],14)
y=para('<b>Sæt overskrifter i række 7:</b><br/>A: År · B: Restgæld før · C: Rente<br/>D: Afdrag · E: Ydelse · F: Restgæld efter',48,300,size=15)
y=para('<b>Første termin, række 8:</b><br/>A8: <b>1</b> &nbsp; B8: <b>=$B$1</b><br/>C8: <b>=B8*$B$2</b> &nbsp; E8: <b>=$B$4</b><br/>D8: <b>=E8-C8</b> &nbsp; F8: <b>=B8-D8</b>',48,y,size=15)
para('<b>Næste termin:</b> A9 = A8+1, B9 = F8.<br/>Kopiér C8:F8 til C9:F9. Kopiér derefter hele række 9 ned til række 11.',48,y,size=14)
y=para('<b>Kontroller dit ark</b><br/>Restgælden efter år 4 er nul (bortset fra maskinafrunding).<br/>Afdragene summerer til 2.000.000 kr.<br/>Rente + afdrag = ydelse i alle rækker.',500,530,size=17)
y=para('<b>Pris ud fra betalingsrækken</b><br/>I et særskilt ark: år i kolonne A, betaling i B og effektiv årlig rente i E1.<br/>Nutidsværdi i C2: <b>=B2/(1+$E$1)^A2</b><br/>Kopiér ned, og læg nutidsværdierne sammen. Det er prisen på beregningsdatoen.',500,y,size=16)
y=para('<b>Rente ud fra prisen</b><br/>Brug Målsøgning på summen af nutidsværdierne. Sæt den til den observerede pris ved at ændre rentecellen. Ved lige lange perioder kan IRR eller RATE også bruges; køb har negativt fortegn, indbetalinger positivt.',500,y,size=15)
para('<b>Grundlag:</b> Opgave 2.1-2.8 i kapitel 2-slides, ID ch02-s050 til ch02-s072. Selvstændigt genberegnede løsninger og figurer. Hæftet følger opgavernes stiliserede forudsætninger.',500,y,size=12)

# Numerical checks against independent identities and the exercise coverage.
assert abs(sum(r[3] for r in ann)-H0)<1e-7
assert abs(remaining)<1e-7
assert round(A)==564024
assert abs(sum(A/1.05**t for t in range(1,5))-H0)<1e-7
assert round(bond(4,.04,3),2)==96.37
assert abs(bond(4,y3,3)-96.37)<1e-10
assert abs(fv6-1e6*1.06**3)<1e-7
assert abs(fv2-1183624)<1e-7
assert abs(1e6*(1+ret2)**3-fv2)<1e-7
assert page_no==20
c.save()
qa={'pages':pages,'checks':'All numerical assertions passed; all text and table bottom bounds passed.',
    'results':{'annuity':A,'zero_yield':y0,'coupon_yield_exact':y3,'fv_6pct':fv6,'fv_2pct':fv2,'realized_2pct':ret2}}
qadir=ROOT/'work/ch02-solutions-qa'; qadir.mkdir(parents=True,exist_ok=True)
(qadir/'checks.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Created {OUT} ({page_no} pages). Numerical and layout-bound checks passed.')
