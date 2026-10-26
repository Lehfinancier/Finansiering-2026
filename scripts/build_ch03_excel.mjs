// Chapter 3 exercise solutions. Local output only; no site changes or publication.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const qa=path.join(root,'work/ch03-excel-qa');
const require=createRequire(path.join(qa,'package.json'));
const {Workbook,SpreadsheetFile}=await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const out=path.join(root,'outputs/01a15558-33a2-7ab0-8172-87a04b40c77e');
await fs.mkdir(out,{recursive:true});
const wb=Workbook.create(), sheets={}, cells=[];
const navy='#142F44',teal='#087F8C',gold='#CA7A20',pale='#EDF4F6',amber='#FFF2CC';
const num='#,##0.00;(#,##0.00);0.00',pct='0.00%;(0.00%);0.00%',df='0.000000';
const extents={'3.1':54,'3.2':66,'3.3':52,'3.4':45,'3.5':34,'3.6':67};
function v(s,c,x){s.getRange(c).values=[[x]];}
function f(s,c,x,fmt=num){s.getRange(c).formulas=[[x]];s.getRange(c).setNumberFormat(fmt);s.getRange(c).format.font.color='#000000';cells.push([s.name,c]);}
function text(s,r,t,c='B'){v(s,c+r,t);}
function note(s,r,t){text(s,r,t);s.getRange(`B${r}:H${r}`).format.font.color='#536675';}
function section(s,r,t){text(s,r,t);s.getRange(`B${r}:H${r}`).format.fill=pale;s.getRange(`B${r}:H${r}`).format.font.bold=true;}
function editable(s,c,x,fmt=num){v(s,c,x);s.getRange(c).setNumberFormat(fmt);s.getRange(c).format.fill=amber;s.getRange(c).format.font.color='#0000FF';}
function input(s,r,t,x,fmt=num){text(s,r,t);editable(s,'C'+r,x,fmt);}
function calc(s,r,t,x,fmt=num){text(s,r,t);f(s,'C'+r,x,fmt);}
function head(s,r,labels){let end=String.fromCharCode(65+labels.length);const range=s.getRange(`B${r}:${end}${r}`);range.values=[labels];range.format.fill=navy;range.format.font.color='#FFFFFF';range.format.font.bold=true;range.format.wrapText=true;range.format.horizontalAlignment='center';range.format.rowHeight=34;}
function total(s,r,end='H'){let a=s.getRange(`B${r}:${end}${r}`);a.format.fill=pale;a.format.font.bold=true;a.format.borders={top:{style:'thin',color:navy}};}
function chart(s,ranges,title,start,end,unit,fmt='0.00',type='line'){
 const ch=s.charts.add(type,ranges.map(r=>s.getRange(r)));ch.title=title;ch.setPosition(start,end);
 ch.titleTextStyle.typeface='Arial';ch.titleTextStyle.fontSize=15;
 ch.legend={position:'top',textStyle:{typeface:'Arial',fontSize:12}};
 ch.xAxis={axisType:type==='scatter'?'valueAxis':'textAxis',textStyle:{typeface:'Arial',fontSize:11}};
 ch.yAxis={numberFormatCode:fmt,numberFormatSourceLinked:false,textStyle:{typeface:'Arial',fontSize:11}};
 ch.yAxis.title.text=unit;
 ch.series.items.forEach((ser,i)=>{ser.fill=[teal,gold,navy][i%3];if(type!=='bar')ser.line={fill:[teal,gold,navy][i%3],style:'solid',width:2};});
 if(ch.series.items.length===1)ch.hasLegend=false;
 return ch;
}
for(const [name,last] of Object.entries(extents)){
 const s=wb.worksheets.add(name);sheets[name]=s;s.showGridLines=false;s.tabColor=teal;
 const area=s.getRange(`A1:I${last}`);area.format.font={name:'Arial',size:11,color:navy};area.format.rowHeight=24;area.format.verticalAlignment='center';
 s.getRange(`A1:A${last}`).format.columnWidth=3;s.getRange(`B1:B${last}`).format.columnWidth=38;
 s.getRange(`C1:H${last}`).format.columnWidth=19;s.getRange(`I1:I${last}`).format.columnWidth=3;
 text(s,2,'Opgave '+name);s.getRange('B2:H2').format.font={size:17,bold:true};s.getRange('B2:H2').format.rowHeight=32;
 s.getRange('B3:H3').format.borders={bottom:{style:'thin',color:teal}};s.getRange('A3:I5').format.rowHeight=6;s.freezePanes.freezeRows(2);
}

let s=sheets['3.1'];section(s,6,'Input');input(s,7,'Hovedstol',100);input(s,8,'Årlig kuponrente',.08,pct);
input(s,9,'Prøverente til (b)',.0293,'0.0000%');
head(s,12,['År','Spotrente','Diskonteringsfaktor','Nulkupon: betaling','Kupon: betaling','Nulkupon: PV','Kupon: PV']);
for(let i=0;i<2;i++){const r=13+i;v(s,`B${r}`,i+1);editable(s,`C${r}`,[.01,.03][i],pct);f(s,`D${r}`,`=1/(1+C${r})^B${r}`,df);f(s,`E${r}`,i===0?'=0':'=$C$7');f(s,`F${r}`,`=$C$7*$C$8+E${r}`);f(s,`G${r}`,`=E${r}*D${r}`);f(s,`H${r}`,`=F${r}*D${r}`);}
text(s,15,'(a) Kurs = sum af nutidsværdier');f(s,'G15','=SUM(G13:G14)');f(s,'H15','=SUM(H13:H14)');total(s,15);
calc(s,18,'(b) Nulkupon: effektiv rente','=(C7/G15)^(1/B14)-1','0.0000%');
calc(s,19,'Kupon: eksakt effektiv rente','=RATE(B14,C7*C8,-H15,C7)','0.0000%');
calc(s,20,'Kurs ved prøverenten','=F13/(1+C9)^B13+F14/(1+C9)^B14','0.0000');
calc(s,21,'Afvigelse fra kurvens pris','=C20-H15','0.0000');
note(s,23,'(b) Indsæt prøverenten i begge diskonteringsled. Den lille afvigelse skyldes afrunding til 2,93 %.');
note(s,24,'RATE finder den ene rente, som giver samme pris som spotkurven.');
section(s,26,'(c) Hvorfor bliver de effektive renter forskellige?');
note(s,27,'Med opgavens input får kuponobligationen en betaling allerede i år 1, hvor spotrenten er lavere.');
note(s,28,'Dens effektive rente bliver derfor lavere end nulkuponobligationens. Den er ikke et simpelt gennemsnit.');
note(s,29,'Spotrenten priser én betalingsdato. Den effektive rente opsummerer en hel betalingsrække.');
section(s,31,'(d) Horisontal og vertikal rentestruktur');
note(s,32,'Ingen af delene rent: slutdatoen er ens, og forskellen skyldes betalingsprofilen på samme kurve.');
note(s,33,'Horisontal: sammenlign fx 1- og 2-årige nulkuponrenter for samme risiko og valuta.');
note(s,34,'Vertikal: sammenlign fx stat og realkredit ved samme løbetid med hensyn til betalingsprofil og vilkår.');
chart(s,['B12:B14','E12:E14','F12:F14'],'Betalingernes størrelse og tidspunkt','B37','H53','Betaling pr. 100 nominel','0','bar');

s=sheets['3.2'];section(s,6,'Input');input(s,7,'Hovedstol',100);input(s,8,'Kuponrente på ny obligation',.02,pct);
head(s,10,['Obligation','År','Kuponrente','Markedskurs']);
for(const [r,label,year,coupon,price] of [[11,'Skatkammerbevis',1,0,98.04],[12,'Kuponobligation A',2,.03,100.03],[13,'Kuponobligation B',3,.04,100.15]]){text(s,r,label);v(s,`C${r}`,year);editable(s,`D${r}`,coupon,pct);editable(s,`E${r}`,price);}
// The one-year instrument remains a zero-coupon bond, as specified in the exercise.
s.getRange('D11').format.fill='#F1F3F5';s.getRange('D11').format.font.color=navy;
section(s,16,'(a–b) Find én ny diskonteringsfaktor ad gangen');
head(s,18,['Trin / løbetid','Kupon','PV af tidlige kuponer','Nutidsværdi af slutbetalingen','Slutbetaling','Diskonteringsfaktor','Spotrente']);
for(let i=0;i<3;i++){
 const r=19+i,src=11+i;f(s,`B${r}`,`=C${src}`,'0');f(s,`C${r}`,`=$C$7*D${src}`);
 f(s,`D${r}`,i===0?'=0':i===1?`=C${r}*G19`:`=C${r}*SUM(G19:G20)`);
 f(s,`E${r}`,`=E${src}-D${r}`);f(s,`F${r}`,`=$C$7+C${r}`);f(s,`G${r}`,`=E${r}/F${r}`,df);f(s,`H${r}`,`=G${r}^(-1/B${r})-1`,'0.0000%');
}
note(s,23,'Træk værdien af de kendte tidlige kuponer fra kursen. Resten betaler for den sidste betaling.');
note(s,24,'Diskonteringsfaktor = restpris / slutbetaling. Spotrente = faktor^(-1/år) - 1.');
note(s,25,'Loven om én pris: samme betaling på samme dato og med samme risiko skal koste det samme.');
note(s,26,'Ellers kan de samme betalinger købes billigt og sælges dyrt. Opgaven ser bort fra handelsfriktioner.');
calc(s,28,'(b) Pris i dag på 1 kr. om 2 år','=G20',df);
note(s,29,'d₂ er prisen i dag på én krone, som modtages om to år, på det anvendte prisningsgrundlag.');
section(s,31,'(c) Pris på den nye 3-årige obligation');
head(s,33,['År','Betaling','Diskonteringsfaktor','Nutidsværdi']);
for(let i=0;i<3;i++){const r=34+i;v(s,`B${r}`,i+1);f(s,`C${r}`,`=$C$7*$C$8+IF(B${r}=$B$21,$C$7,0)`);f(s,`D${r}`,`=G${19+i}`,df);f(s,`E${r}`,`=C${r}*D${r}`);}
text(s,37,'Teoretisk kurs');f(s,'E37','=SUM(E34:E36)');total(s,37,'E');
section(s,39,'(d) Fra handlede instrumenter til en sammenhængende kurve');
note(s,40,'Brug kuponobligationer eller swaps: kendte tidlige betalinger gør det muligt at udlede senere kurvepunkter.');
note(s,41,'Mellem observerede løbetider bruges interpolation eller kurvetilpasning. En 10-årig nulkupon behøver ikke handles.');
note(s,42,'En glat tilpasning dæmper kunstige hak og ustabile priser og risikomål mellem punkterne.');
note(s,43,'Glathed alene sikrer ikke fravær af arbitrage. Kurven skal også være konsistent med priser og betalingsvilkår.');
note(s,44,'De oplyste kurser er afrundede. Brug de uafrundede beregnede faktorer videre i regnearket.');
chart(s,['B18:B21','H18:H21'],'Bootstrappede nulkuponrenter','B47','H64','Årlig spotrente','0.00%');

s=sheets['3.3'];section(s,6,'Input');input(s,7,'Hovedstol',100);input(s,8,'Årlig kuponrente',.03,pct);input(s,9,'Markedskurs K',99.2);
head(s,12,['År','Spotrente','Diskonteringsfaktor','Kupon','Hovedstol','Betaling i alt','Nutidsværdi']);
for(let i=0;i<4;i++){const r=13+i;v(s,`B${r}`,i+1);editable(s,`C${r}`,[.02,.024,.028,.03][i],pct);f(s,`D${r}`,`=1/(1+C${r})^B${r}`,df);f(s,`E${r}`,'=$C$7*$C$8');f(s,`F${r}`,i===3?'=$C$7':'=0');f(s,`G${r}`,`=SUM(E${r}:F${r})`);f(s,`H${r}`,`=G${r}*D${r}`);}
text(s,17,'(a) Teoretisk kurs K*');f(s,'H17','=SUM(H13:H16)');total(s,17);
calc(s,20,'(b) K* minus markedskurs','=H17-C9');
text(s,21,'Pris relativt til swapkurven');f(s,'C21','=IF(ABS(C20)<0.0000001,"På kurven",IF(C20>0,"Billig","Dyr"))','General');
note(s,23,'Positiv forskel: markedet kræver mindre betaling end værdien beregnet på swapkurven.');
section(s,25,'(c) Et positivt gab er ikke i sig selv et sikkert godt køb');
note(s,26,'Gabet kan kompensere for kreditrisiko, lav likviditet eller særlige rettigheder og afspejle modelusikkerhed.');
note(s,27,'Kapitel 7 vurderer relativ værdi med en referencekurve og et spænd, bl.a. OAS ved konverterbare obligationer.');
section(s,29,'(d) Statsobligationer kan handles over værdien på swapkurven');
note(s,30,'Investorer kan betale ekstra for sikkerhed, likviditet og regulatoriske egenskaber. Det sænker afkastkravet.');
note(s,31,'Swapmarkedet giver flere løbetider og en fælles reference for prisning og afdækning.');
note(s,32,'Statskurven har færre danske serier og særlige præmier. Valg af reference ændrer fortolkningen af gabet.');
note(s,33,'Ingen vedhængende rente i opgaven: clean og dirty kurs er ens. Alle værdier er pr. 100 nominel.');
chart(s,['B12:B16','H12:H16'],'Hver betalings bidrag til kursen','B36','H51','Nutidsværdi pr. 100 nominel','0.00','bar');

s=sheets['3.4'];section(s,6,'Opgavens tre kurvepunkter');
head(s,8,['Løbetid, år','Rente']);
[[.25,.038],[2,.03],[30,.034]].forEach((a,i)=>{v(s,`B${9+i}`,a[0]);editable(s,`C${9+i}`,a[1],pct);});s.getRange('B9:B11').setNumberFormat('0.00');
calc(s,13,'Kort ende: ændring, procentpoint','=(C10-C9)*100');calc(s,14,'Lang ende: ændring, procentpoint','=(C11-C10)*100');
note(s,16,'Forklaringerne nedenfor gælder opgavens oprindelige kurve.');
section(s,18,'(a) Forventninger til de korte renter');
note(s,19,'Under forventningshypotesen peger den inverse korte ende på forventede fald i fremtidige korte renter.');
note(s,20,'Det kan passe med forventede rentenedsættelser ved lavere inflation eller svagere konjunkturer.');
note(s,21,'Kurven er ikke en sikker prognose: risikopræmier og efterspørgsel kan også påvirke formen.');
section(s,23,'(b) Løbetidspræference og (c) markedssegmentering');
note(s,24,'(b) Lange obligationer er mere kursfølsomme. En løbetidspræmie kan derfor løfte den lange ende.');
note(s,25,'(c) Pensionskassers større efterspørgsel løfter priserne på lange obligationer og sænker deres renter, alt andet lige.');
note(s,26,'Det er markedssegmentering: behov for bestemte løbetider påvirker netop disse dele af kurven.');
section(s,28,'(d) Flere mekanismer kan virke samtidig');
note(s,29,'Forventninger, løbetidspræmier og segmentering kan forklare forskellige dele af samme kurve.');
note(s,30,'Renterne behøver derfor ikke flytte sig lige meget. Et parallelt skift er kun ét muligt scenarie.');
const curve=chart(s,['B8:B11','C8:C11'],'Rentekurvens tre oplyste punkter','B33','H44','Årlig rente','0.0%','scatter');
curve.xAxis.title.text='Løbetid, år';
note(s,45,'Grafen viser kun de tre oplyste punkter. Renterne mellem punkterne er ikke oplyst.');

s=sheets['3.5'];section(s,6,'Input');input(s,7,'Fast rentetillæg, basispunkter',45,'0');input(s,8,'Markedskurs',99.5);
calc(s,10,'(a) Tillæg, procentpoint','=C7/100','0.00');calc(s,11,'Tillæg som rentesats','=C7/10000',pct);
note(s,13,'100 basispunkter = 1 procentpoint. Tillægget lægges til CIBOR 6M i kuponformlen.');
section(s,15,'(b) Fejlen i notatet');
note(s,16,'De 45 basispunkter er et fast kontrakttillæg. Det er dette tillæg, der ligger fast i kuponformlen.');
note(s,17,'Spændet er markedets aktuelle afkastkrav relativt til en angivet referencekurve. Det kan ændre sig med kursen.');
section(s,19,'(c) Kurs under pari');
text(s,21,'Spænd relativt til tillægget');f(s,'C21','=IF(C8<100,"Over",IF(C8>100,"Under","Lig med"))','General');
note(s,23,'Med CIBOR 6M som relevant reference og ens konventioner giver køb under 100 en ekstra kursgevinst.');
note(s,24,'Med opgavens tal får investor tillægget og en kursgevinst frem mod indfrielse til 100. Spændet er derfor over 45 bp.');
note(s,25,'Retningen i C21 følger kursen under disse forenklinger. Et præcist spænd kræver flere betalings- og kurvedata.');
section(s,27,'(d) Fastlæggelse af rentetillæg ved udstedelse');
note(s,28,'1. Vælg referencekurven, så kompensationen måles på et tydeligt grundlag.');
note(s,29,'2. Fastlæg det ønskede spænd ud fra bl.a. kredit, likviditet og øvrige placeringsmuligheder.');
note(s,30,'3. Oversæt spændet til et kuponvilkår med den valgte fixing-reference.');
note(s,31,'Tag højde for auktionskurs, afdrag og rentekonventioner. Et ønsket spænd er ikke automatisk samme rentetillæg.');

s=sheets['3.6'];section(s,6,'Input');
head(s,8,['År','Spotrente','A: betaling','B: betaling']);
for(let i=0;i<3;i++){const r=9+i;v(s,`B${r}`,i+1);editable(s,`C${r}`,[.01,.02,.03][i],pct);editable(s,`D${r}`,[0,104.04,0][i]);editable(s,`E${r}`,[50.5,0,54.64][i]);}
input(s,13,'(c) Ny 3-årig spotrente',.04,pct);input(s,14,'(d) Parallelt skift',.01,pct);
section(s,16,'(a–b) Nutidsværdi og gennemsnitlig betalingstid');
head(s,18,['År','Diskonteringsfaktor','A: PV','B: PV','A: PV-vægt','B: PV-vægt']);
for(let i=0;i<3;i++){const r=19+i,src=9+i;f(s,`B${r}`,`=B${src}`,'0');f(s,`C${r}`,`=1/(1+C${src})^B${src}`,df);f(s,`D${r}`,`=D${src}*C${r}`,'0.000000');f(s,`E${r}`,`=E${src}*C${r}`,'0.000000');f(s,`F${r}`,`=D${r}/$D$22`,pct);f(s,`G${r}`,`=E${r}/$E$22`,pct);}
text(s,22,'(a) Samlet nutidsværdi');f(s,'D22','=SUM(D19:D21)','0.000000');f(s,'E22','=SUM(E19:E21)','0.000000');total(s,22,'G');
text(s,24,'(b) PV-vægtet tid, år');f(s,'D24','=SUMPRODUCT(B19:B21,F19:F21)','0.000000');f(s,'E24','=SUMPRODUCT(B19:B21,G19:G21)','0.000000');
note(s,26,'Gennemsnitlig tid = sum af (år × nutidsværdi) / samlet nutidsværdi.');
note(s,27,'Med de oprindelige input afrundes begge værdier til 100,00 og begge betalingstider til 2,00 år.');
note(s,28,'B afviger lidt før afrunding, fordi slutbetalingen 54,64 er afrundet. Beregningerne bevarer alle decimaler.');
section(s,30,'(c–d) Pris hver betaling igen med den ændrede spotrente');
head(s,32,['År','(c) Spotrente','(c) A: PV','(c) B: PV','(d) Spotrente','(d) A: PV','(d) B: PV']);
for(let i=0;i<3;i++){const r=33+i,src=9+i;f(s,`B${r}`,`=B${src}`,'0');f(s,`C${r}`,i===2?'=$C$13':`=C${src}`,pct);f(s,`D${r}`,`=D${src}/(1+C${r})^B${r}`,'0.000000');f(s,`E${r}`,`=E${src}/(1+C${r})^B${r}`,'0.000000');f(s,`F${r}`,`=C${src}+$C$14`,pct);f(s,`G${r}`,`=D${src}/(1+F${r})^B${r}`,'0.000000');f(s,`H${r}`,`=E${src}/(1+F${r})^B${r}`,'0.000000');}
text(s,36,'Ny værdi');for(const c of ['D','E','G','H'])f(s,c+'36',`=SUM(${c}33:${c}35)`,'0.000000');total(s,36);
head(s,39,['Kurveskift','A: værditab','B: værditab','A: tab i %','B: tab i %']);
text(s,40,'(c) Kun 3-årig rente');f(s,'C40','=D22-D36');f(s,'D40','=E22-E36');f(s,'E40','=C40/D22',pct);f(s,'F40','=D40/E22',pct);
text(s,41,'(d) Parallelt skift');f(s,'C41','=D22-G36');f(s,'D41','=E22-H36');f(s,'E41','=C41/D22',pct);f(s,'F41','=D41/E22',pct);
note(s,43,'Positivt værditab betyder, at prisen er faldet. Negativt værditab er en gevinst.');
note(s,44,'(c) A har ingen betaling i år 3 og rammes ikke. B mister værdi på sin 3-årige betaling.');
note(s,45,'(d) Ved et parallelt skift taber begge omtrent lige meget, men ikke præcis det samme.');
note(s,46,'Næsten samme gennemsnitlige betalingstid skjuler, hvor på kurven betalingerne ligger.');
note(s,47,'Kapitel 4 har derfor brug for renterisiko fordelt på løbetider, fx nøglerentevarighed, ud over ét samlet mål.');
chart(s,['B39:B41','C39:C41','D39:D41'],'Værditab ved de to kurveskift','B50','H65','Værditab i samme enhed som betalingerne','0.00','bar');

wb.recalculate();
const d1=98.04/100,d2=(100.03-3*d1)/103,d3=(100.15-4*d1-4*d2)/104;
const k31=8/1.01+108/1.03**2,y31=(8+Math.sqrt(64+4*k31*108))/(2*k31)-1;
const k33=3/1.02+3/1.024**2+3/1.028**3+103/1.03**4;
const b0=50.5/1.01+54.64/1.03**3;
const expected=[['3.1','G15',100/1.03**2],['3.1','H15',k31],['3.1','C18',.03],['3.1','C19',y31],['3.1','C20',8/1.0293+108/1.0293**2],
 ['3.2','G19',d1],['3.2','G20',d2],['3.2','G21',d3],['3.2','H19',d1**-1-1],['3.2','H20',d2**-.5-1],['3.2','H21',d3**(-1/3)-1],['3.2','E37',2*d1+2*d2+102*d3],
 ['3.3','H17',k33],['3.3','C20',k33-99.2],['3.4','C13',-.8],['3.4','C14',.4],['3.5','C10',.45],['3.5','C11',.0045],
 ['3.6','D22',100],['3.6','E22',b0],['3.6','D24',2],['3.6','E24',(50+3*54.64/1.03**3)/b0],['3.6','C40',0],['3.6','D40',b0-(50+54.64/1.04**3)],['3.6','C41',100-104.04/1.03**2],['3.6','D41',b0-(50.5/1.02+54.64/1.04**3)]];
function check(name,cell,want){const got=sheets[name].getRange(cell).values[0][0];if(typeof got!=='number'||Math.abs(got-want)>Math.max(1e-8,Math.abs(want)*1e-9))throw Error(`${name}!${cell}: ${got} != ${want}`);}
for(const a of expected)check(...a);
// Independent repricing of calibration instruments with the bootstrapped factors.
if(Math.abs(3*d1+103*d2-100.03)>1e-9||Math.abs(4*d1+4*d2+104*d3-100.15)>1e-9)throw Error('Bootstrap repricing');
const mutations=[
 {sheet:'3.1',input:'C13',value:.03,restore:.01,cell:'C19',expected:.03},
 {sheet:'3.1',input:'C8',value:0,restore:.08,cell:'H15',expected:100/1.03**2},
 {sheet:'3.2',input:'E11',value:100,restore:98.04,cell:'G20',expected:(100.03-3)/103},
 {sheet:'3.3',input:'C9',value:k33,restore:99.2,cell:'C20',expected:0},
 {sheet:'3.6',input:'C14',value:0,restore:.01,cell:'D41',expected:0},
 {sheet:'3.6',input:'C13',value:.03,restore:.04,cell:'D40',expected:0},
];
for(const m of mutations){v(sheets[m.sheet],m.input,m.value);wb.recalculate();check(m.sheet,m.cell,m.expected);v(sheets[m.sheet],m.input,m.restore);}
wb.recalculate();for(const a of expected)check(...a);
for(const [name,c] of cells){let x=sheets[name].getRange(c).values[0][0];if(typeof x==='string'&&/^#(REF|DIV|VALUE|NAME|N\/A|NUM|NULL|SPILL|CALC)/.test(x))throw Error(`${name}!${c} ${x}`);}
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},maxChars:2000});
await fs.writeFile(path.join(qa,'errors.ndjson'),errors.ndjson);
const inspection=await wb.inspect({kind:'table',range:"'3.2'!B18:H21",include:'values,formulas',tableMaxRows:4,tableMaxCols:7,maxChars:4000});
await fs.writeFile(path.join(qa,'bootstrap.ndjson'),inspection.ndjson);
const charts=[];for(const [name,sh] of Object.entries(sheets))for(const ch of sh.charts.items)charts.push({sheet:name,title:ch.title.text,type:ch.type,series:ch.series.items.map(x=>({formula:x.formula,categoryFormula:x.categoryFormula}))});
await fs.writeFile(path.join(qa,'checks.json'),JSON.stringify({results:expected.map(([sheet,cell,expected])=>({sheet,cell,expected})),mutations,charts},null,2));
const xlsx=await SpreadsheetFile.exportXlsx(wb);const filename=path.join(out,'kapitel-03-beregninger.xlsx');await xlsx.save(filename);
console.log('Saved '+filename);console.log(`${expected.length} numeric checks and ${mutations.length} input changes passed. ${charts.length} charts.`);
for(const [name,last] of Object.entries(extents)){const blob=await wb.render({sheetName:name,range:`A1:I${last}`,scale:1,format:'png'});await fs.writeFile(path.join(qa,name+'.png'),new Uint8Array(await blob.arrayBuffer()));console.log('Rendered '+name);}
