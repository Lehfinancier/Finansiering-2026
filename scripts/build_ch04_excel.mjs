// Chapter 4 exercise solutions. Local output only; no site changes or publication.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const qa=path.join(root,'work/ch04-excel-qa');
const require=createRequire(path.join(qa,'package.json'));
const {Workbook,SpreadsheetFile}=await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const out=path.join(root,'outputs/01a15558-33a2-7ab0-8172-87a04b40c77e');
await fs.mkdir(out,{recursive:true});
const wb=Workbook.create(), sheets={}, cells=[];
const navy='#142F44',teal='#087F8C',gold='#CA7A20',pale='#EDF4F6',amber='#FFF2CC';
const num='#,##0.00;-#,##0.00;0.00',pct='0.00%;-0.00%;0.00%',df='0.000000';
const extents={'4.1':66,'4.2':45,'4.3':71,'4.4':49,'4.5':50,'4.6':53,'4.7':30};
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



let s=sheets['4.1'];section(s,6,'Input');input(s,7,'Hovedstol',100);input(s,8,'Årlig kuponrente',.06,pct);input(s,9,'Effektiv årlig rente',.05,pct);
note(s,11,'Fire årlige betalinger. Gule felter er input. Kurser og betalinger er pr. 100 nominel.');
section(s,13,'(a) Stående obligation S');
head(s,15,['År','Restgæld primo','Kupon','Afdrag','Betaling','Nutidsværdi','Vægt × år']);
for(let i=0;i<4;i++){const r=16+i;v(s,`B${r}`,i+1);f(s,`C${r}`,'=$C$7');f(s,`D${r}`,`=C${r}*$C$8`);f(s,`E${r}`,i===3?'=$C$7':'=0');f(s,`F${r}`,`=D${r}+E${r}`);f(s,`G${r}`,`=F${r}/(1+$C$9)^B${r}`);f(s,`H${r}`,`=G${r}/$G$20*B${r}`,'0.0000');}
text(s,20,'Kurs og Macaulay-varighed, år');f(s,'G20','=SUM(G16:G19)','0.000');f(s,'H20','=SUM(H16:H19)','0.000');total(s,20);
head(s,22,['År','S: andel af kursen','A: andel af kursen']);
for(let i=0;i<4;i++){const r=23+i;v(s,`B${r}`,i+1);f(s,`C${r}`,`=G${16+i}/$G$20`,pct);f(s,`D${r}`,`=G${31+i}/$G$35`,pct);}
section(s,28,'(b) Serieobligation A');head(s,30,['År','Restgæld primo','Kupon','Afdrag','Betaling','Nutidsværdi','Vægt × år']);
for(let i=0;i<4;i++){const r=31+i;v(s,`B${r}`,i+1);f(s,`C${r}`,`=$C$7-(B${r}-1)*$C$7/4`);f(s,`D${r}`,`=C${r}*$C$8`);f(s,`E${r}`,'=$C$7/4');f(s,`F${r}`,`=D${r}+E${r}`);f(s,`G${r}`,`=F${r}/(1+$C$9)^B${r}`);f(s,`H${r}`,`=G${r}/$G$35*B${r}`,'0.0000');}
text(s,35,'Kurs og Macaulay-varighed, år');f(s,'G35','=SUM(G31:G34)','0.000');f(s,'H35','=SUM(H31:H34)','0.000');total(s,35);
note(s,37,'Vægt = betalingens nutidsværdi / kursen. Varighed = summen af vægt × år.');
section(s,39,'(c) Samme slutdato, forskelligt tyngdepunkt');
note(s,40,'S betaler hele hovedstolen i år 4. A betaler en fjerdedel tilbage hvert år.');
note(s,41,'A\'s betalinger kommer tidligere, så en større del af kursen stammer fra de første år. Varigheden bliver kortere.');
section(s,43,'(d) Varighed er ikke en tilbagebetalingstid');
note(s,44,'S\'s varighed i H20 er en vægtet gennemsnitstid. Der falder ingen betaling på netop det tidspunkt.');
note(s,45,'S betaler først hovedstolen i år 4. Varigheden siger ikke, hvornår købsprisen er tjent hjem.');
chart(s,['B22:B26','C22:C26','D22:D26'],'Hvert års nutidsværdi som andel af kursen','B48','H65','Andel af kursen','0%','bar');

s=sheets['4.2'];section(s,6,'Obligation S fra 4.1');
calc(s,7,'Kurs',"='4.1'!G20",'0.000');calc(s,8,'Macaulay-varighed, år',"='4.1'!H20",'0.000');calc(s,9,'Effektiv årlig rente',"='4.1'!C9",pct);
section(s,11,'(a) Samme følsomhed i tre enheder');
calc(s,13,'Modificeret varighed, %/pp','=C8/(1+C9)','0.000');calc(s,14,'Kronevarighed, kurspoint/pp','=C13*C7/100','0.000');calc(s,15,'BPV, kurspoint/bp','=C14/100','0.000000');
note(s,17,'MD = D / (1 + rente). Kronevarighed = MD × kurs / 100. BPV = kronevarighed / 100.');
note(s,18,'pp = procentpoint; bp = basispunkt. Risikomålene vises som positive tal; en rentestigning giver et kurstab.');
section(s,20,'(b) Fra basispunkter til kursændring');input(s,22,'Rentestigning, bp',25,'0');
calc(s,23,'Renteændring som decimaltal','=C22/10000','0.0000');calc(s,24,'Renteændring, procentpoint','=C22/100','0.00');
calc(s,25,'Estimeret kursændring, %','=-C13*C23',pct);calc(s,26,'Estimeret kursændring, kurspoint','=-C14*C24');calc(s,27,'Estimeret ny kurs','=C7+C26');
section(s,29,'(c) Fra kurs til kroner');input(s,31,'Nominelt beløb, kr.',20000000,'#,##0');input(s,32,'Rentestigning, bp',50,'0');
calc(s,33,'Markedsværdi, kr.','=C31*C7/100','#,##0.00');calc(s,34,'Estimeret tab, kr.','=C33*C13*C32/10000','#,##0.00');
note(s,36,'Tabet vises som et positivt beløb. Det er markedsværdien, ikke det nominelle beløb, der ganges med den procentvise kursnedgang.');
section(s,38,'(d) Fejlen er at blande enheder');
note(s,39,'25 bp = 0,25 procentpoint = 0,0025. Indsæt 0,0025 i MD-formlen, ikke 25.');
note(s,40,'MD × renteændring som decimaltal giver den procentvise kursændring. Gang med kursen for at få kurspoint.');
note(s,42,'Alternativt: kronevarighed × 0,25 giver kursfaldet direkte i kurspoint.');
note(s,44,'Regnearket bruger uafrundede tal fra 4.1, så resultaterne kan afvige lidt fra afrundede facitter.');

s=sheets['4.3'];section(s,6,'Obligation S fra 4.1');calc(s,7,'Effektiv årlig rente',"='4.1'!C9",pct);calc(s,8,'Kurs',"='4.1'!G20",'0.000');calc(s,9,'Kronevarighed, kurspoint/pp',"='4.2'!C14",'0.000');
section(s,11,'(a) Konveksitet: sene betalinger tæller ekstra');head(s,13,['År','Betaling','Nutidsværdi','År × (år + 1)','Nutidsværdi × år × (år + 1)']);
for(let i=0;i<4;i++){const r=14+i;v(s,`B${r}`,i+1);f(s,`C${r}`,`='4.1'!F${16+i}`);f(s,`D${r}`,`=C${r}/(1+$C$7)^B${r}`);f(s,`E${r}`,`=B${r}*(B${r}+1)`);f(s,`F${r}`,`=D${r}*E${r}`);}
text(s,18,'Sum');f(s,'F18','=SUM(F14:F17)');total(s,18,'F');calc(s,20,'Kronekonveksitet, kurspoint/pp²','=F18/(1+C7)^2/10000','0.000000');
note(s,22,'Del summen med (1 + rente)² og med 10.000, så renteændringen kan indsættes i procentpoint.');
section(s,24,'(b–c) Faktiske kurser og to estimater');head(s,26,['Renteændring, pp','Ny rente','Faktisk kurs','Faktisk kursændring','Estimat: kun varighed','Konveksitetsled','Estimat: med konveksitet']);
for(let i=0;i<2;i++){const r=27+i;editable(s,`B${r}`,[2,-2][i]);f(s,`C${r}`,`=$C$7+B${r}/100`,pct);f(s,`D${r}`,`=$C$14/(1+C${r})+$C$15/(1+C${r})^2+$C$16/(1+C${r})^3+$C$17/(1+C${r})^4`);f(s,`E${r}`,`=D${r}-$C$8`);f(s,`F${r}`,`=-$C$9*B${r}`);f(s,`G${r}`,`=0.5*$C$20*B${r}^2`);f(s,`H${r}`,`=F${r}+G${r}`);}
note(s,30,'Kursen i D og ændringerne i E–H måles i kurspoint. Minus er tab; plus er gevinst.');
section(s,32,'(d) Den rette linje ligger under den krumme priskurve');
note(s,33,'S har positiv konveksitet. Derfor undervurderer varighed alene gevinsten ved rentefald og overvurderer tabet ved rentestigning.');
note(s,34,'Konveksitetsleddet er positivt, uanset om renten stiger eller falder.');
note(s,35,'Varighed plus konveksitet kommer tættere på. Den faktiske kurs fås kun ved at diskontere alle betalinger med den nye rente.');
head(s,38,['Ny rente','Faktisk kurs','Kun varighed','Varighed + konveksitet']);
for(let i=0;i<9;i++){const r=39+i;f(s,`B${r}`,`=$C$7+(${i}-4)/100`,pct);f(s,`C${r}`,`=$C$14/(1+B${r})+$C$15/(1+B${r})^2+$C$16/(1+B${r})^3+$C$17/(1+B${r})^4`);f(s,`D${r}`,`=$C$8-$C$9*(B${r}-$C$7)*100`);f(s,`E${r}`,`=D${r}+0.5*$C$20*((B${r}-$C$7)*100)^2`);}
text(s,38,'Rente i graf','F');
for(let r=39;r<=47;r++)f(s,`F${r}`,`=TEXT(B${r},"0%")`,'General');
s.getRange('F38:F47').format.horizontalAlignment='center';
s.getRange('F38').format.fill=navy;s.getRange('F38').format.font.color='#FFFFFF';s.getRange('F38').format.font.bold=true;
const priceChart=chart(s,['F38:F47','C38:C47','D38:D47','E38:E47'],'Faktisk kurs og to estimater','B50','H70','Kurs pr. 100 nominel','0.00');
priceChart.xAxis={numberFormatCode:'0%',numberFormatSourceLinked:false,title:{text:'Effektiv årlig rente'}};
priceChart.yAxis={min:85,max:125,majorUnit:5};

s=sheets['4.4'];section(s,6,'(a–b) Markedsværdi og nominel værdi giver forskellige vægte');
head(s,8,['Obligation','Nominelt, kr.','Kurs','Markedsværdi, kr.','Modificeret varighed','Vægt efter markedsværdi','Kronevarighed, kurspoint/pp']);
for(let i=0;i<2;i++){const r=9+i;text(s,r,'Obligation '+(i+1));editable(s,`C${r}`,[40000000,10000000][i],'#,##0');editable(s,`D${r}`,[80,120][i]);f(s,`E${r}`,`=C${r}*D${r}/100`,'#,##0');editable(s,`F${r}`,[2,7][i],'0.00');f(s,`G${r}`,`=E${r}/$E$11`,pct);f(s,`H${r}`,`=F${r}*D${r}/100`);}
text(s,11,'I alt');f(s,'C11','=SUM(C9:C10)','#,##0');f(s,'E11','=SUM(E9:E10)','#,##0');f(s,'G11','=SUM(G9:G10)',pct);total(s,11);
calc(s,14,'(a) Korrekt modificeret varighed','=SUMPRODUCT(F9:F10,G9:G10)','0.000000');calc(s,15,'Juniorens varighed (nominelle vægte)','=SUMPRODUCT(C9:C10,F9:F10)/C11');
calc(s,17,'(b) Kronevarighed, kurspoint/pp','=SUMPRODUCT(C9:C10,H9:H10)/C11');
note(s,19,'Modificeret varighed vægtes med markedsværdier, fordi den måler den procentvise ændring i markedsværdien.');
note(s,20,'Kronevarighed pr. 100 nominel vægtes med nominelle beløb, fordi kursen allerede indgår i den.');
section(s,22,'(c) To veje til samme kronetab');input(s,24,'Rentestigning, procentpoint',1);
calc(s,25,'Tab via modificeret varighed, kr.','=E11*C14*C24/100','#,##0.00');calc(s,26,'Tab via kronevarighed, kr.','=C11/100*C17*C24','#,##0.00');calc(s,27,'Forskel, kr.','=C25-C26');calc(s,28,'Porteføljens BPV, kr./bp','=C11/100*C17/100','#,##0.00');
section(s,30,'(d) Nøgletallene hænger sammen');calc(s,32,'Porteføljekurs pr. 100 nominel','=E11/C11*100');calc(s,33,'Modificeret varighed × kurs / 100','=C14*C32/100');calc(s,34,'Juniorens estimerede tab, kr.','=E11*C15*C24/100','#,##0.00');calc(s,35,'Juniorens undervurdering, kr.','=C25-C34','#,##0.00');
note(s,37,'Med opgavens tal har obligation 2 både den højeste varighed og en kurs over 100. Den vejer derfor mere i markedsværdi end nominelt.');
head(s,39,['Obligation','Vægt efter nominel værdi','Vægt efter markedsværdi']);
for(let i=0;i<2;i++){const r=40+i;text(s,r,'Obligation '+(i+1));f(s,`C${r}`,`=C${9+i}/$C$11`,pct);f(s,`D${r}`,`=G${9+i}`,pct);}
note(s,43,'Junioren giver den mest rentefølsomme obligation for lille vægt og undervurderer derfor risikoen.');
note(s,46,'Begge tab er varighedsestimater. Der er ikke oplyst betalinger til at beregne den faktiske nye kurs.');

s=sheets['4.5'];section(s,6,'Forpligtelsen');input(s,8,'Forpligtelse, kr.',10000000,'#,##0');input(s,9,'Horisont, år',7,'0');input(s,10,'Effektiv årlig rente',.03,pct);calc(s,12,'Nutidsværdi af forpligtelsen, kr.','=C8/(1+C10)^C9','#,##0.00');
section(s,14,'(a) Vælg Y: match både nutidsværdi og varighed');head(s,16,['Obligation','Varighed, år','Horisont minus varighed, år','Varighed i forhold til horisont']);
for(let i=0;i<3;i++){const r=17+i;text(s,r,['X','Y','Z'][i]);editable(s,`C${r}`,[4,7,10][i],'0');f(s,`D${r}`,`=$C$9-C${r}`,'0');f(s,`E${r}`,`=IF(D${r}=0,"Matcher",IF(D${r}>0,"For kort","For lang"))`,'General');}
s.getRange('E17:E19').format.horizontalAlignment='center';
note(s,21,'Forpligtelsen er én betaling på horisonten, så dens Macaulay-varighed er lig horisonten.');
note(s,22,'Investér nutidsværdien i Y. Så har aktiv og forpligtelse samme værdi og reagerer ens på en lille parallel renteændring.');
section(s,24,'(b) Hvad går galt med X og Z?');
note(s,26,'X ved rentefald: X\'s betalinger modtages før horisonten og må geninvesteres til den lavere rente.');
note(s,27,'Kursgevinsten opvejer ikke det lavere afkast på de geninvesterede betalinger, så værdien på horisonten bliver mindre end forpligtelsen.');
note(s,29,'Z ved rentestigning: Z\'s betalinger efter horisonten skal sælges, og deres salgsværdi falder.');
note(s,30,'Faldet er større end gevinsten ved at geninvestere de tidlige betalinger til den højere rente.');
section(s,32,'(c) Når horisonten svarer til varigheden');
note(s,34,'Betalinger før horisonten geninvesteres frem til horisonten. Betalinger efter horisonten sælges dér til markedskurs.');
note(s,35,'Når horisonten er lig varigheden, opvejer de to virkninger hinanden ved et lille parallelt renteskift lige efter købet.');
note(s,36,'Værdien på horisonten ændres så kun lidt. Store skift, ændret kurveform eller flere skift undervejs kan stadig give afvigelser.');
section(s,38,'(d) To grunde til løbende justering');
note(s,40,'1. Når tiden går, falder horisonten ét år pr. år, men obligationens varighed falder ikke nødvendigvis lige så hurtigt.');
note(s,41,'2. Når renten ændrer sig, ændres nutidsværdierne og dermed varigheden. Matchet skal derfor kontrolleres igen.');
note(s,43,'Forudsætninger: samme rente for alle løbetider, små parallelle renteskift og faste, kendte betalinger.');
note(s,45,'Genplaceringsrisiko handler om fremtidigt afkast på modtagne betalinger, ikke om ændringer i de faste kuponer.');
note(s,47,'Kuponer og løbetider for X, Y og Z er ikke oplyst. Der kan derfor ikke beregnes eksakte slutværdier.');

s=sheets['4.6'];section(s,6,'Input');input(s,7,'Hovedstol',100);input(s,8,'Årlig kuponrente',.05,pct);input(s,9,'Rentestød, procentpoint',1);
section(s,11,'(a) Hver betaling har sin egen spotrente');head(s,13,['År','Spotrente','Betaling','Nutidsværdi','Andel af kursen','Vægt × år']);
for(let i=0;i<3;i++){const r=14+i;v(s,`B${r}`,i+1);editable(s,`C${r}`,[.01,.02,.03][i],pct);f(s,`D${r}`,`=$C$7*$C$8+IF(B${r}=3,$C$7,0)`);f(s,`E${r}`,`=D${r}/(1+C${r})^B${r}`,'0.000000');f(s,`F${r}`,`=E${r}/$E$17`,pct);f(s,`G${r}`,`=F${r}*B${r}`,'0.000000');}
text(s,17,'Kurs og Fisher–Weil-varighed, år');f(s,'E17','=SUM(E14:E16)','0.000000');f(s,'G17','=SUM(G14:G16)','0.000000');total(s,17,'G');
note(s,19,'Fisher–Weil-varighed er den gennemsnitlige betalingstid, vægtet med nutidsværdier beregnet på spotkurven.');
section(s,21,'(b) Én spotrente kan ikke erstatte hele kurven');
note(s,22,'Hver spotrente gælder én betalingsdato. Diskonteres alle betalinger med én af dem, ændres både kursen og vægtene.');
note(s,23,'Én effektiv rente kan give samme kurs, men den skal beregnes. Den er ikke bare en af spotrenterne.');
section(s,25,'(c) Genberegn den ramte betaling; de øvrige er uændrede');head(s,27,['Stød rammer år','Ny spotrente','Nutidsværdi før','Nutidsværdi efter','Kursfald, kurspoint','Ny samlet kurs','Andel af samlet fald']);
for(let i=0;i<3;i++){const r=28+i,src=14+i;f(s,`B${r}`,`=B${src}`,'0');f(s,`C${r}`,`=C${src}+$C$9/100`,pct);f(s,`D${r}`,`=E${src}`);f(s,`E${r}`,`=D${src}/(1+C${r})^B${r}`);f(s,`F${r}`,`=D${r}-E${r}`);f(s,`G${r}`,`=$E$17-F${r}`);f(s,`H${r}`,`=IF(SUM($F$28:$F$30)=0,0,F${r}/SUM($F$28:$F$30))`,pct);}
calc(s,32,'(d) Sum af lokale kursfald','=SUM(F28:F30)');calc(s,33,'Kurs efter parallelt skift','=SUM(E28:E30)');calc(s,34,'Kursfald ved parallelt skift','=E17-C33');calc(s,35,'Forskel, kurspoint','=C32-C34','0.000000');
note(s,37,'Hvert lokalt stød rammer kun én betaling. Derfor er summen præcis lig kursfaldet ved det parallelle skift.');
note(s,38,'Rammer flere stød den samme betaling, er summen kun en tilnærmelse.');
note(s,39,'Den store slutbetaling gør år 3 dominerende. Fordelingen viser, hvor på kurven renterisikoen ligger.');
chart(s,['B27:B30','F27:F30'],'Kursfald, når kun én spotrente stiger','B41','H52','Kurspoint','0.00','bar');

s=sheets['4.7'];
section(s,6,'(a) 10 års løbetid betyder 10 års varighed — falsk');
note(s,8,'En kuponobligation betaler også før udløb. Nutidsværdiernes tyngdepunkt ligger derfor før år 10.');
note(s,9,'En 10-årig nulkuponobligation har derimod Macaulay-varighed på 10 år: hele betalingen kommer til sidst.');
section(s,12,'(b) Modificeret varighed giver den præcise ændring — falsk');
note(s,14,'Varighed er en lineær tilnærmelse for små renteændringer. Den ser bort fra priskurvens krumning.');
note(s,15,'Opgave 4.3 viser det: konveksitet bringer estimatet tættere på, men kun en ny prisberegning giver den faktiske kurs.');
section(s,18,'(c) Positiv konveksitet er en gratis fordel — falsk');
note(s,20,'Ved samme varighed giver højere konveksitet større kursgevinst ved rentefald og mindre kurstab ved rentestigning.');
note(s,21,'Fordelen er typisk betalt via en højere kurs og dermed lavere effektiv rente. Mest konveksitet er ikke altid bedst.');
section(s,24,'(d) Nul kronevarighed betyder ingen renterisiko — falsk');
note(s,26,'Nul kronevarighed betyder kun, at et lille parallelt renteskift ikke ændrer værdien i det lineære estimat.');
note(s,27,'Ændret kurveform og store renteskift kan stadig give tab eller gevinst. Se de lokale stød i 4.6.');

// Cross-sheet references are green; all calculations retain unrounded values.
for(const [name,cell] of cells){const q=sheets[name].getRange(cell);if(q.formulas[0][0].includes("'4."))q.format.font.color='#008000';}
wb.recalculate();
const pv=(cfs,y)=>cfs.reduce((a,c,i)=>a+c/(1+y)**(i+1),0);
const ss=[6,6,6,106],aa=[31,29.5,28,26.5],k=pv(ss,.05),ka=pv(aa,.05);
const dur=(cf,y)=>cf.reduce((a,c,i)=>a+(i+1)*c/(1+y)**(i+1),0)/pv(cf,y);
const d=dur(ss,.05),md=d/1.05,kr=md*k/100;
const cv=ss.reduce((a,c,i)=>a+(i+1)*(i+2)*c/1.05**(i+1),0)/1.05**2/10000;
const spots=[.01,.02,.03],cf=[5,5,105],kp=cf.reduce((a,c,i)=>a+c/(1+spots[i])**(i+1),0);
const falls=cf.map((c,i)=>c/(1+spots[i])**(i+1)-c/(1+spots[i]+.01)**(i+1));
const expected=[['4.1','G20',k],['4.1','H20',d],['4.1','G35',ka],['4.1','H35',dur(aa,.05)],['4.2','C13',md],['4.2','C14',kr],['4.2','C15',kr/100],['4.2','C25',-md*.0025],['4.2','C26',-kr*.25],['4.2','C34',20000000/100*k*md*.005],['4.3','C20',cv],['4.3','D27',pv(ss,.07)],['4.3','D28',pv(ss,.03)],['4.3','H27',-kr*2+cv*2],['4.3','H28',kr*2+cv*2],['4.4','C14',148/44],['4.4','C17',2.96],['4.4','C25',1480000],['4.4','C26',1480000],['4.4','C28',14800],['4.4','C32',88],['4.4','C33',2.96],['4.4','C35',160000],['4.5','C12',10000000/1.03**7],['4.6','E17',kp],['4.6','G17',cf.reduce((a,c,i)=>a+(i+1)*c/(1+spots[i])**(i+1),0)/kp],...falls.map((v,i)=>['4.6','F'+(28+i),v]),['4.6','C34',falls.reduce((a,b)=>a+b)],['4.6','C35',0]];
function check(name,cell,want){const got=sheets[name].getRange(cell).values[0][0];if(typeof got!=='number'||Math.abs(got-want)>Math.max(1e-8,Math.abs(want)*1e-9))throw Error(`${name}!${cell}: ${got} != ${want}`);}
for(const a of expected)check(...a);
const mutations=[{sheet:'4.1',input:'C8',value:0,restore:.06,cell:'H20',expected:4},{sheet:'4.2',input:'C22',value:0,restore:25,cell:'C26',expected:0},{sheet:'4.3',input:'B27',value:0,restore:2,cell:'E27',expected:0},{sheet:'4.4',input:'C24',value:0,restore:1,cell:'C25',expected:0},{sheet:'4.5',input:'C10',value:0,restore:.03,cell:'C12',expected:10000000},{sheet:'4.6',input:'C9',value:0,restore:1,cell:'C34',expected:0}];
for(const m of mutations){v(sheets[m.sheet],m.input,m.value);wb.recalculate();check(m.sheet,m.cell,m.expected);v(sheets[m.sheet],m.input,m.restore);}
wb.recalculate();for(const a of expected)check(...a);
for(const [name,c] of cells){let x=sheets[name].getRange(c).values[0][0];if(typeof x==='string'&&/^#(REF|DIV|VALUE|NAME|N\/A|NUM|NULL|SPILL|CALC)/.test(x))throw Error(`${name}!${c} ${x}`);}
await fs.writeFile(path.join(qa,'checks.json'),JSON.stringify({results:expected.map(([sheet,cell,expected])=>({sheet,cell,expected})),mutations},null,2));
const xlsx=await SpreadsheetFile.exportXlsx(wb);const filename=path.join(out,'kapitel-04-beregninger.xlsx');await xlsx.save(filename);
console.log(`Saved ${filename}; ${expected.length} results and ${mutations.length} input changes passed.`);
for(const [name,last] of Object.entries(extents)){const blob=await wb.render({sheetName:name,range:`A1:I${last}`,scale:1,format:'png'});await fs.writeFile(path.join(qa,name+'.png'),new Uint8Array(await blob.arrayBuffer()));console.log('Rendered '+name);}

