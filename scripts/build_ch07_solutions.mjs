// Run with the bundled Node runtime. Artifact Tool is resolved through the local QA junction.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const qa=path.join(root,'work/ch07-solutions-qa');
const require=createRequire(path.join(qa,'package.json'));
const {Workbook,SpreadsheetFile}=await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const out=path.join(root,'outputs/ch07-solutions');
await fs.mkdir(out,{recursive:true});
const wb=Workbook.create();
const navy='#203864',blue='#D9E1F2',gray='#F2F2F2',yellow='#FFFF00';
const num='0.0000',pct='0.00%',signed='+0.00000;-0.00000;0.00000';
const sheets={};
function val(s,c,x){s.getRange(c).values=[[x]];}
function formula(s,c,x,fmt=num){s.getRange(c).formulas=[[x]];s.getRange(c).setNumberFormat(fmt);}
function input(s,c,x,fmt=num){val(s,c,x);s.getRange(c).setNumberFormat(fmt);s.getRange(c).format.fill=yellow;s.getRange(c).format.font.color='#0000FF';}
function line(s,r,t){val(s,'A'+r,t);s.getRange(`A${r}:H${r}`).format.font.color='#595959';}
function section(s,r,t){val(s,'A'+r,t);s.getRange(`A${r}:H${r}`).format.font.bold=true;s.getRange(`A${r}:H${r}`).format.font.color=navy;}
function head(s,r,labels){const a=s.getRangeByIndexes(r-1,0,1,labels.length);a.values=[labels];a.format.fill=blue;a.format.font.bold=true;a.format.wrapText=true;a.format.rowHeight=35;a.format.horizontalAlignment='center';}
function total(s,r,end='H'){s.getRange(`A${r}:${end}${r}`).format.fill=gray;s.getRange(`A${r}:${end}${r}`).format.font.bold=true;}
function result(s,r,label,f,fmt=num){val(s,'A'+r,label);formula(s,'B'+r,f,fmt);total(s,r,'B');}
function explanatory(s,r,t){line(s,r,t);}
const extents={'7.1':39,'7.2':39,'7.3':62,'7.4':53,'7.5':45,'7.6':58};
const titles={
 '7.1':'Fra betalingsrækker til modelpris','7.2':'Konverteringsrettens værdi',
 '7.3':'OAS: fra diskontering til kalibrering','7.4':'Varighed og konveksitet',
 '7.5':'CPR, pari og kronevarighed','7.6':'Debitorspænd og OAS'};
for(const [name,last] of Object.entries(extents)){
 const s=wb.worksheets.add(name);sheets[name]=s;s.showGridLines=true;
 const area=s.getRange(`A1:H${last}`);area.format.font={name:'Arial',size:11,color:'#000000'};area.format.rowHeight=22;area.format.verticalAlignment='center';
 s.getRange(`A1:A${last}`).format.columnWidth=39;s.getRange(`B1:H${last}`).format.columnWidth=15;
 val(s,'A1',`Opgave ${name}: ${titles[name]}`);s.getRange('A1:H1').format.font={size:14,bold:true};s.getRange('A1:H1').format.rowHeight=29;
 line(s,2,'Gule felter med blå tekst er input. Beregnede tal opdateres, når input ændres.');
 line(s,3,'Kilde: Kurs 100, kapitel 7, opgave '+name+'. Forklaringerne gælder opgavens oprindelige input.');
 s.freezePanes.freezeRows(3);
}

let s=sheets['7.1'];
section(s,5,'Input: to stier');head(s,6,['Sti','Vægt','Betaling 1','Betaling 2','DF 1','DF 2']);
[['A',.4,13.05,89.3025,.99,.985],['B',.6,5.21,97.2405,.99,.975]].forEach((a,i)=>{val(s,'A'+(7+i),a[0]);a.slice(1).forEach((v,j)=>input(s,String.fromCharCode(66+j)+(7+i),v,j===0?'0.00':num));});
section(s,10,'(a) Beregn nutidsværdi på hver sti');head(s,11,['Sti','PV af\nbetaling 1','PV af\nbetaling 2','Stiværdi','Vægtet bidrag']);
for(let i=0;i<2;i++){let r=12+i,k=7+i;formula(s,'A'+r,`=A${k}`,'General');formula(s,'B'+r,`=C${k}*E${k}`);formula(s,'C'+r,`=D${k}*F${k}`);formula(s,'D'+r,`=B${r}+C${r}`);formula(s,'E'+r,`=B${k}*D${r}`);}
result(s,15,'Modelpris','=SUM(E12:E13)','0.000000');
line(s,17,'Hver betaling ganges med sin diskonteringsfaktor. Læg derefter sammen på stien.');
line(s,18,'Til sidst ganges hver stiværdi med sin prisningsvægt, og bidragene lægges sammen.');
section(s,20,'(b) Betaling og faktor skal følges ad');
line(s,21,'Renten påvirker både konvertering og diskontering. Derfor hører betaling og faktor sammen.');
section(s,23,'(c) Beregn gennemsnittene hver for sig');
head(s,24,['Termin','Gns. betaling','Gns. DF','Produkt']);
val(s,'A25',1);val(s,'A26',2);
formula(s,'B25','=SUMPRODUCT(B7:B8,C7:C8)');formula(s,'B26','=SUMPRODUCT(B7:B8,D7:D8)');
formula(s,'C25','=SUMPRODUCT(B7:B8,E7:E8)','0.000000');formula(s,'C26','=SUMPRODUCT(B7:B8,F7:F8)','0.000000');
formula(s,'D25','=B25*C25','0.000000');formula(s,'D26','=B26*C26','0.000000');
result(s,28,'Pris med separate gennemsnit','=SUM(D25:D26)','0.000000');
result(s,29,'Overvurdering, kurspoint','=B28-B15','0.000000');
line(s,31,'På termin 2 er den store betaling på B knyttet til den lave faktor 0,975.');
line(s,32,'Separate gennemsnit bryder denne sammenhæng og giver her en lidt for høj pris.');
section(s,34,'(d) Prisningsvægt er ikke en prognose');
line(s,35,'0,40 er en vægt til prisberegningen. Den siger ikke, at sti A faktisk vil ske i 40% af tilfældene.');
line(s,36,'Prisningsvægte bruges sammen med modellens faktorer til at prissætte risiko.');
line(s,38,'Priser og betalinger er pr. 100 nominel. DF er en faktor, ikke en rente.');

s=sheets['7.2'];section(s,5,'Input: rente og nominel');
val(s,'A6','Rente på næste termin');input(s,'B6',4,'0.00');
val(s,'A7','Diskonteringsrente pr. termin');input(s,'B7',.02,pct);
val(s,'A8','Oprindelig nominel / pari');input(s,'B8',100,'0.00');
head(s,10,['Scenarie','Vægt','CPR','Værdi pr. 100 fortsættende']);
[['Højere rente',.3,0,94],['Mellemste rente',.4,0,100],['Lavere rente',.3,.3,108]].forEach((a,i)=>{val(s,'A'+(11+i),a[0]);a.slice(1).forEach((v,j)=>input(s,String.fromCharCode(66+j)+(11+i),v,j===1?pct:'0.00'));});
section(s,15,'(a–b) Betaling og værdi på terminen');
head(s,16,['Scenarie','Indfrielse','Betaling inkl. rente','Fortsættende nominel','Fortsættende værdi','I alt på termin','Vægtet nutidsværdi']);
for(let i=0;i<3;i++){let r=17+i,k=11+i;formula(s,'A'+r,`=A${k}`,'General');formula(s,'B'+r,`=$B$8*C${k}`);formula(s,'C'+r,`=$B$6+B${r}`);formula(s,'D'+r,`=$B$8-B${r}`);formula(s,'E'+r,`=D${r}/100*D${k}`);formula(s,'F'+r,`=C${r}+E${r}`);formula(s,'G'+r,`=B${k}*F${r}/(1+$B$7)`);}
result(s,21,'Konverterbar pris','=SUM(G17:G19)');
line(s,23,'Ved lavere rente får investor 4 + 30 = 34 udbetalt. Der er 70 nominel tilbage.');
line(s,24,'De 70 har værdi 70/100 × 108 = 75,60. Samlet værdi på terminen: 109,60.');
section(s,26,'(c) Samme scenarier uden ekstraordinær indfrielse');
head(s,27,['Scenarie','Rente + fortsættende værdi','Vægtet nutidsværdi']);
for(let i=0;i<3;i++){let r=28+i,k=11+i;formula(s,'A'+r,`=A${k}`,'General');formula(s,'B'+r,`=$B$6+$B$8/100*D${k}`);formula(s,'C'+r,`=B${k}*B${r}/(1+$B$7)`);}
result(s,32,'Pris uden indfrielsen','=SUM(C28:C30)');result(s,33,'Konverteringsrettens værdi','=B32-B21');
section(s,35,'(d) Hvorfor er den konverterbare pris lavere?');
line(s,36,'I scenariet med lavere rente byttes 30% af en værdi på 108 ud med betaling til 100.');
line(s,37,'Tab på terminen: 30% × (108 − 100) = 2,40. Vægt og diskontér: 0,30 × 2,40 / 1,02.');
line(s,38,'Investor har solgt retten til låntager: konverterbar pris = pris uden indfrielse − optionens værdi.');

s=sheets['7.3'];section(s,5,'Input: faste årlige betalinger');
head(s,6,['År','Betaling','Swapkurvens rente']);
[[1,6,.02],[2,6,.022],[3,106,.024]].forEach((a,i)=>a.forEach((v,j)=>input(s,String.fromCharCode(65+j)+(7+i),v,j===2?pct:'0.00')));
val(s,'A11','Markedskurs');input(s,'B11',109.5,'0.00');val(s,'A12','Prøv et OAS');input(s,'B12',.002780699908,pct);
section(s,14,'(a) Diskontér hver betaling');head(s,15,['År','PV ved OAS = 0','PV ved OAS = 0,50%','PV ved valgt OAS']);
val(s,'A16','OAS');input(s,'B16',0,pct);input(s,'C16',.005,pct);formula(s,'D16','=B12',pct);
for(let i=0;i<3;i++){const r=17+i,k=7+i;formula(s,'A'+r,`=A${k}`,'0');for(const c of ['B','C','D'])formula(s,c+r,`=$B${k}/(1+$C${k}+${c}$16)^$A${k}`,'0.000000');}
val(s,'A20','Modelpris');for(const c of ['B','C','D'])formula(s,c+'20',`=SUM(${c}17:${c}19)`,'0.000000');total(s,20,'D');
val(s,'A21','Modelpris − markedskurs');for(const c of ['B','C','D'])formula(s,c+'21',`=${c}20-$B$11`,'0.000000');
section(s,23,'(b–c) Indkreds OAS ved at halvere intervallet');
line(s,24,'Markedskursen ligger mellem priserne ved 0 og 50 bp. OAS ligger derfor mellem 0 og 50 bp.');
line(s,25,'Prøv midten. For høj modelpris: hæv den nedre grænse. For lav pris: sænk den øvre grænse.');
head(s,27,['Forsøg','Nedre grænse, bp','Øvre grænse, bp','Midtpunkt, bp','Pris ved midtpunkt','Pris − marked']);
for(let r=28;r<=43;r++){
 val(s,'A'+r,r-27);
 formula(s,'B'+r,r===28?'=$B$16*10000':`=IF(F${r-1}>0,D${r-1},B${r-1})`);
 formula(s,'C'+r,r===28?'=$C$16*10000':`=IF(F${r-1}>0,C${r-1},D${r-1})`);
 formula(s,'D'+r,`=(B${r}+C${r})/2`);
 formula(s,'E'+r,`=$B$7/(1+$C$7+D${r}/10000)^$A$7+$B$8/(1+$C$8+D${r}/10000)^$A$8+$B$9/(1+$C$9+D${r}/10000)^$A$9`,'0.000000');
 formula(s,'F'+r,`=E${r}-$B$11`,'0.000000');
}
result(s,45,'OAS fra sidste forsøg, bp','=D43');result(s,46,'Samme OAS i procent','=B45/10000','0.000000%');
line(s,48,'Halveringen kræver, at markedskursen ligger mellem de to startpriser. Justér grænserne ved behov.');
line(s,49,'Alternativ i Excel: Målsøgning. Sæt D20 til markedskursen ved at ændre B12.');
section(s,51,'(d) En anden CPR kan give et andet OAS');
line(s,52,'Ny CPR ændrer betalingernes størrelse og tidspunkt. Det kan ændre modelprisen ved samme OAS.');
line(s,53,'For at ramme den samme markedskurs må diskonteringsspændet derfor kalibreres igen.');
line(s,54,'Her er betalingerne fastlagt. Når OAS justeres i denne opgave, ændres de ikke.');
section(s,56,'(e) Tre begreber skal holdes adskilt');
line(s,57,'Debitorspænd ændrer låntagers refinansiering og dermed Gain, CPR og betalinger.');
line(s,58,'OAS ændrer investors diskontering. Det kan afspejle kredit, likviditet og modellens fejl.');
line(s,59,'Negativt OAS betyder, at markedskursen er højere end modelprisen ved OAS = 0.');
line(s,60,'Alle renter er årlige. 1 procentpoint = 100 basispunkter (bp).');

s=sheets['7.4'];section(s,5,'Input: modelpriser med adfærdsbestemt CPR');
line(s,6,'Flad 3%-kurve, OAS = 0 og poolfaktor = 1. Ved rentestød genberegnes CPR og betalinger.');
head(s,8,['Modelinput','NYK 6% 2053','NYK 1% 2050']);
[['Startkurs',104.91238,78.00841],['Kurs ved 15 bp ned',104.97581,78.97836],['Kurs ved 15 bp op',104.80074,77.04093]].forEach((a,i)=>{val(s,'A'+(9+i),a[0]);input(s,'B'+(9+i),a[1],'0.00000');input(s,'C'+(9+i),a[2],'0.00000');});
val(s,'A13','Rentestød, bp');input(s,'B13',15,'0');val(s,'A14','Samme stød, procentpoint');formula(s,'B14','=B13/100');val(s,'A15','Samme stød, decimalrente');formula(s,'B15','=B13/10000');
section(s,17,'(a–b) Beregn varighed og konveksitet');head(s,18,['Risikomål','NYK 6% 2053','NYK 1% 2050']);
val(s,'A19','Kronevarighed, point/pp');val(s,'A20','PVBP, point/bp');val(s,'A21','Kronekonveksitet, point/pp²');
for(const c of ['B','C']){formula(s,c+'19',`=(${c}10-${c}11)/(2*$B$14)`,'0.000000');formula(s,c+'20',`=${c}19/100`,'0.000000');formula(s,c+'21',`=(${c}10+${c}11-2*${c}9)/$B$14^2`,'0.000000');}
total(s,19,'C');total(s,21,'C');
line(s,23,'KV = (kurs ved rentefald − kurs ved rentestigning) / (2 × stød i procentpoint).');
line(s,24,'Konveksitet = (de to stødkurser − 2 × startkurs) / stød². Her bruges 0,15 procentpoint.');
line(s,25,'Brug af 0,0015 uden enhedskorrektion giver konveksitet, der er 10.000 gange for stor.');
section(s,27,'(c–d) Fortolkning');
line(s,28,'Lavkuponen har størst rentefølsomhed. Betalingerne forventes at fortsætte længere.');
line(s,29,'Højkuponen indfries lettere ved rentefald. Investor mister derfor nogle attraktive kuponer.');
line(s,30,'Ved rentestigning falder konverteringen, og betalingerne kan blive længere.');
line(s,31,'Begge KV er positive. Højkuponens negative konveksitet betyder, at kurven krummer nedad.');
line(s,32,'Negativ varighed ville betyde, at en lille rentestigning løfter prisen. Det viser tallene ikke her.');
section(s,34,'Frivillig udvidelse: kursændring ved større rentestød');
line(s,35,'Kursændring ≈ −KV × Δy + ½ × kronekonveksitet × Δy². Δy måles i procentpoint.');
head(s,37,['Obligation','Stød, bp','Stød, pp','Varighedsled','Konveksitetsled','Kursændring','Estimeret kurs']);
for(let i=0;i<4;i++){const r=38+i,c=i<2?'B':'C';val(s,'A'+r,i<2?'NYK 6% 2053':'NYK 1% 2050');input(s,'B'+r,i%2===0?-50:50,'0');formula(s,'C'+r,`=B${r}/100`);formula(s,'D'+r,`=-${c}$19*C${r}`,signed);formula(s,'E'+r,`=0.5*${c}$21*C${r}^2`,signed);formula(s,'F'+r,`=D${r}+E${r}`,signed);formula(s,'G'+r,`=${c}$9+F${r}`);}
line(s,43,'Nøgletallene er målt tæt på startkursen. Ved 50 bp kan CPR og prisens krumning ændre sig meget.');
line(s,44,'En fuld modelkørsel beregner betalingerne igen ved det større stød og kan derfor give et andet svar.');
line(s,49,'Input er oplyste modelresultater. Excel beregner risikomålene; det genkører ikke konverteringsmodellen.');

s=sheets['7.5'];section(s,5,'(a) Omregn mellem år og kvartal');
val(s,'A6','Årlig CPR');input(s,'B6',.1,pct);result(s,7,'Tilsvarende kvartals-CPR','=1-(1-B6)^(1/4)','0.0000%');
val(s,'A9','Kvartalsvis CPR');input(s,'B9',.05,pct);result(s,10,'Tilsvarende årlig CPR','=1-(1-B9)^4','0.0000%');
line(s,12,'Regn på den andel, der bliver tilbage. Fire kvartaler med 5% CPR efterlader 0,95⁴.');
section(s,14,'Input fra CPR-forsøget, 4. september 2026');
head(s,15,['Årlig CPR','6%: kurs','6%: KV','1%: kurs','1%: KV']);
[[0,123.44,11.45,77.14,7.41],[.02,114,6.75,85.92,5],[.05,108.41,3.99,91.63,3.26],[.1,105.06,2.34,95.2,2.03],[.2,102.91,1.27,97.48,1.16]].forEach((a,i)=>a.forEach((v,j)=>input(s,String.fromCharCode(65+j)+(16+i),v,j===0?pct:'0.00')));
section(s,22,'(b og d) Fra 2% til 10% årlig CPR');head(s,23,['Ændring','NYK 6% 2053','NYK 1% 2050']);
val(s,'A24','Kursændring, kurspoint');formula(s,'B24','=B19-B17',signed);formula(s,'C24','=D19-D17',signed);total(s,24,'C');
val(s,'A25','Relativ kursændring');formula(s,'B25','=B24/B17',pct);formula(s,'C25','=C24/D17',pct);
val(s,'A26','Ændring i KV, point/pp');formula(s,'B26','=C19-C17',signed);formula(s,'C26','=E19-E17',signed);
section(s,28,'(c) Hvorfor får prisændringerne forskelligt fortegn?');
line(s,29,'6%-obligationen: flere høje kuponer forsvinder, når hovedstolen indfries tidligere til 100. Kursen falder.');
line(s,30,'1%-obligationen: tidligere betaling af 100 er mere værd end de lave kuponer og den sene hovedstol.');
section(s,32,'(d) Hvorfor falder KV i begge tilfælde?');
line(s,33,'Mere af hovedstolen kommer tidligt. Den er derfor udsat for renteændringer i kortere tid.');
line(s,34,'CPR og OAS fastholdes under rentestødet. Denne KV medtager derfor ingen CPR-reaktion på renten.');
line(s,35,'I opgave 7.4 blev CPR derimod genberegnet ved rentestødet. Det er to forskellige risikomål.');
section(s,37,'(e) Delivery option og indfrielse under pari');
line(s,38,'Låntager kan købe obligationer under 100 og indfri med dem. Det er billigere end pariindfrielse.');
line(s,39,'Denne mulighed er slået fra for lavkuponen, så forsøget isolerer tidligere betaling til 100.');
line(s,40,'Forsøget viser en priseffekt. Det er ikke en prognose om, at låntagere vil vælge den dyre indfrielse.');
line(s,42,'Kilde til modeltabellen: kapitel 7, CPR-forsøget. KV måles i kurspoint pr. procentpoint.');

s=sheets['7.6'];section(s,5,'Input: NYK 6% 2053, modelberegning 4. september 2026');
line(s,6,'CPR nedenfor dækker de første fire fremtidige terminer. De to forsøg har hver sin kalibrering.');
head(s,8,['Debitorspændsstød, bp','CPR, fire terminer','Kurs','Oplyst kursændring']);
[[-100,.5356,103.92,-1.9],[0,.3208,105.83,0],[100,.1387,108.9,3.08]].forEach((a,i)=>a.forEach((v,j)=>input(s,String.fromCharCode(65+j)+(9+i),v,j===1?pct:j===0?'0':'0.00')));
head(s,13,['OAS-stød, bp','CPR, fire terminer','Kurs','Oplyst kursændring']);
[[-100,.3211,109.23,3.4],[0,.3211,105.83,0],[100,.3211,102.73,-3.09]].forEach((a,i)=>a.forEach((v,j)=>input(s,String.fromCharCode(65+j)+(14+i),v,j===1?pct:j===0?'0':'0.00')));
line(s,18,'Kursændringerne er aflæst i bogens egen kolonne. Afrundede kursniveauer kan give 0,01 points forskel.');
section(s,20,'(a–b) Sammenlign +100 bp');head(s,21,['Ved +100 bp','Debitorspænd','OAS']);
val(s,'A22','CPR før');formula(s,'B22','=B10',pct);formula(s,'C22','=B15',pct);
val(s,'A23','CPR efter');formula(s,'B23','=B11',pct);formula(s,'C23','=B16',pct);
val(s,'A24','CPR-ændring, procentpoint');formula(s,'B24','=(B23-B22)*100','+0.00;-0.00;0.00');formula(s,'C24','=(C23-C22)*100','+0.00;-0.00;0.00');
val(s,'A25','Kursændring, kurspoint');formula(s,'B25','=D11','+0.00;-0.00;0.00');formula(s,'C25','=D16','+0.00;-0.00;0.00');total(s,25,'C');
line(s,27,'Debitorspænd op: refinansiering dyrere, Gain lavere, CPR lavere. Flere høje kuponer bevares.');
line(s,28,'OAS op: samme betalinger diskonteres hårdere. Deres nutidsværdi og dermed prisen falder.');
section(s,30,'(c) Hvad ændres, og hvad er fast?');
line(s,31,'Debitorspænd: refinansieringskurve, Gain, CPR og betalinger ændres. Swapkurve og OAS er faste.');
line(s,32,'OAS: kun investors diskontering ændres. Rentestier, refinansiering, CPR og betalinger er faste.');
line(s,33,'I begge forsøg fastholdes startpulje og øvrige modelinput.');
line(s,34,'En lavkupon langt under pari kan stadig være uattraktiv at konvertere, selv med billigere refinansiering.');
section(s,36,'(d) Sammenlign lige store stød');head(s,37,['Kursændring, point','Debitorspænd','OAS']);
val(s,'A38','−100 bp');formula(s,'B38','=D9','+0.00;-0.00;0.00');formula(s,'C38','=D14','+0.00;-0.00;0.00');
val(s,'A39','+100 bp');formula(s,'B39','=D11','+0.00;-0.00;0.00');formula(s,'C39','=D16','+0.00;-0.00;0.00');
val(s,'A40','Sum: 0 ved symmetri');formula(s,'B40','=SUM(B38:B39)','+0.00;-0.00;0.00');formula(s,'C40','=SUM(C38:C39)','+0.00;-0.00;0.00');
line(s,42,'Gevinst og tab er forskellige i begge forsøg. Prisens reaktion er ikke en ret linje over intervallet.');
line(s,43,'100 bp er et stort stød. Ændringerne er derfor ikke lokale varigheder eller en effekt pr. bp.');
line(s,44,'En lokal spændfølsomhed kræver små stød omkring udgangspunktet i netop det pågældende spænd.');
section(s,46,'(e) Hvad dokumenterer uændret CPR i fire terminer?');
line(s,47,'En samlet fireterminsrate viser ikke, hvornår indfrielserne sker, eller hvad der sker senere.');
line(s,48,'Bed om rente, ordinært afdrag, ekstraordinært udtræk og restgæld termin for termin før og efter.');
line(s,49,'For en model med rentestier skal betalingsrækkerne kunne sammenlignes på de samme stier og vægte.');
line(s,50,'OAS-forsøget fastholder betalingerne som forudsætning. Fireterminstallet er ikke alene beviset.');

wb.recalculate();
const expected=[['7.1','B15',100.3334175],['7.1','B29',.0190512],['7.2','B21',101.843137254902],['7.2','B33',.705882352941],['7.3','B20',110.3470091452],['7.3','C20',108.8304278679],['7.3','B45',27.80699908,.001],['7.4','B19',.583566666667],['7.4','C19',6.4581],['7.4','B21',-2.14266666667],['7.4','C21',.10977777778],['7.4','F38',.02395],['7.4','F39',-.559616666667],['7.5','B7',1-.9**.25],['7.5','B10',1-.95**4],['7.5','B24',-8.94],['7.5','C24',9.28],['7.6','B24',-18.21]];
for(const [sh,cell,x,tol=1e-8] of expected){const actual=sheets[sh].getRange(cell).values[0][0];if(typeof actual!=='number'||Math.abs(actual-x)>tol)throw Error(`${sh}!${cell}: ${actual} != ${x}`);}
// Verify actual recalculation, then restore the delivered input.
input(sheets['7.5'],'B6',0,pct);wb.recalculate();if(sheets['7.5'].getRange('B7').values[0][0]!==0)throw Error('CPR recalculation failed');
input(sheets['7.5'],'B6',.1,pct);
input(sheets['7.3'],'B12',.005,pct);wb.recalculate();if(Math.abs(sheets['7.3'].getRange('D20').values[0][0]-108.83042786792595)>1e-8)throw Error('OAS recalculation failed');
input(sheets['7.3'],'B12',.002780699908,pct);wb.recalculate();
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:40},summary:'Formula errors'})).ndjson);
for(const [name,last] of Object.entries(extents)){
 const preview=await wb.render({sheetName:name,range:`A1:H${last}`,scale:1.4});
 await fs.writeFile(path.join(qa,`${name}.png`),new Uint8Array(await preview.arrayBuffer()));
}
const output=await SpreadsheetFile.exportXlsx(wb);await output.save(path.join(out,'kap7_opgaver.xlsx'));
console.log(JSON.stringify({output:path.join(out,'kap7_opgaver.xlsx'),sheets:Object.keys(sheets),checked:expected.length,recalculation:'CPR and OAS verified'}));
