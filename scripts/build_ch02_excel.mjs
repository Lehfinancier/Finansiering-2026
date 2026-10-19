// Local companion workbook to kapitel-02-loesninger.pdf. No publication.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
process.on('uncaughtException', e => { console.error(e.message); console.error(e.stack?.split('\n').filter(x=>x.includes('build_ch02_excel')).join('\n')); process.exit(1); });
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const qa = path.join(root, 'work/ch02-excel-qa');
const require = createRequire(path.join(qa, 'package.json'));
const { Workbook, SpreadsheetFile } = await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const out = path.join(root, 'outputs/01a15558-33a2-7ab0-8172-87a04b40c77e');
await fs.mkdir(out, {recursive:true});
const wb = Workbook.create();
const navy='#142F44', teal='#087F8C', blue='#0000FF', pale='#EDF4F6', amber='#FFF2CC';
const number='#,##0.00;(#,##0.00);0.00', integer='#,##0', percent='0.00%;(0.00%);0.00%';
const sheets = {};
const extents = {};
const formulaCells = [];
function value(s,cell,v) {s.getRange(cell).values=[[v]];}
function formula(s,cell,f,fmt=number) {
  s.getRange(cell).formulas=[[f]];
  s.getRange(cell).setNumberFormat(fmt);
  s.getRange(cell).format.font.color='#000000';
  formulaCells.push([s.name,cell]);
}
function text(s,row,t,col='B') {value(s,`${col}${row}`,t);}
function note(s,row,t) {text(s,row,t); s.getRange(`B${row}:H${row}`).format.font.color='#536675';}
function section(s,row,title) {
  text(s,row,title); s.getRange(`B${row}:H${row}`).format.fill=pale;
  s.getRange(`B${row}:H${row}`).format.font.bold=true;
}
function input(s,row,label,v,fmt=number,editable=true) {
  text(s,row,label); value(s,`C${row}`,v);
  const r=s.getRange(`C${row}`); r.setNumberFormat(fmt);
  r.format.font.color=editable?blue:navy;
  r.format.fill=editable?amber:'#F1F3F5';
}
function calc(s,row,label,f,fmt=number,explanation='') {
  text(s,row,label); formula(s,`C${row}`,f,fmt);
  if(explanation) {text(s,row,explanation,'E'); s.getRange(`E${row}:H${row}`).format.font.color='#536675';}
}
function header(s,row,labels) {
  const last=String.fromCharCode(65+labels.length);
  const r=s.getRange(`B${row}:${last}${row}`);r.values=[labels];
  r.format.fill=navy;r.format.font.color='#FFFFFF';r.format.font.bold=true;
  r.format.horizontalAlignment='center'; r.format.wrapText=true;r.format.rowHeight=32;
}
function total(s,row,end='H') {
  s.getRange(`B${row}:${end}${row}`).format.fill=pale;
  s.getRange(`B${row}:${end}${row}`).format.font.bold=true;
  s.getRange(`B${row}:${end}${row}`).format.borders={top:{style:'thin',color:navy}};
}
function create(name,last) {
  const s=wb.worksheets.add(name);sheets[name]=s;extents[name]=last;
  s.showGridLines=false;s.tabColor=teal;
  s.getRange(`A1:I${last}`).format.font={name:'Arial',size:11,color:navy};
  s.getRange(`A1:I${last}`).format.rowHeight=23;
  s.getRange(`A1:I${last}`).format.verticalAlignment='center';
  s.getRange(`A1:A${last}`).format.columnWidth=3;
  s.getRange(`B1:B${last}`).format.columnWidth=34;
  s.getRange(`C1:C${last}`).format.columnWidth=20;
  s.getRange(`D1:H${last}`).format.columnWidth=20;
  s.getRange(`I1:I${last}`).format.columnWidth=3;
  text(s,2,'Opgave '+name);s.getRange('B2:H2').format.font={size:17,bold:true};s.getRange('B2:H2').format.rowHeight=32;
  s.getRange('B3:H3').format.borders={bottom:{style:'thin',color:teal}};
  s.getRange('A3:I5').format.rowHeight=6;
  s.freezePanes.freezeRows(2);
  return s;
}
function chart(s,range,title,start,end,ylabel='Kurs pr. 100 nominel',fmt='0.00',type='line') {
  const source=s.name==='2.7'?[s.getRange('H35:H43'),s.getRange('C35:C43'),s.getRange('D35:D43')]:s.getRange(range);
  const ch=s.charts.add(type,source);ch.title=title;ch.setPosition(start,end);
  ch.titleTextStyle.typeface='Arial';ch.titleTextStyle.fontSize=15;
  ch.legend={position:'top',textStyle:{typeface:'Arial',fontSize:12}};
  ch.xAxis={axisType:'textAxis',textStyle:{typeface:'Arial',fontSize:11}};
  if(s.name==='2.7')ch.xAxis={axisType:'textAxis',numberFormatCode:'0%',numberFormatSourceLinked:false,textStyle:{typeface:'Arial',fontSize:11}};
  ch.yAxis={numberFormatCode:fmt,numberFormatSourceLinked:false,textStyle:{typeface:'Arial',fontSize:11}};
  ch.yAxis.title.text=ylabel;
  const colors=[teal,'#CA7A20',navy];
  ch.series.items.forEach((ser,i)=>{ser.fill=colors[i%3];if(type==='line')ser.line={fill:colors[i%3],style:'solid',width:2};});
  return ch;
}
for(const [name,last] of [
 ['2.1',73],['2.2',57],['2.3',47],['2.4',49],
 ['2.5',69],['2.6',56],['2.7',63],['2.8',37],
])create(name,last);

let s=sheets['2.1'];
section(s,6,'Input');input(s,7,'Hovedstol, kr.',2000000);input(s,8,'Årlig rente',.05,percent);input(s,9,'Antal år (fast)',4,integer,false);
calc(s,11,'(a) Fast årlig ydelse','=IF(C8=0,C7/C9,C7*C8/(1-(1+C8)^(-C9)))',number,'Ved 0 % er ydelsen hovedstol / antal år.');total(s,11,'C');
note(s,12,'Ydelsen findes ved at sætte nutidsværdien af de fire ens ydelser lig hovedstolen.');
note(s,13,'Rente = restgæld før betaling × rente. Afdrag = ydelse - rente.');
for(const [start,kind] of [[15,'Annuitet'],[24,'Serie'],[33,'Stående']]) {
 section(s,start-1,kind+' - beløb i kr.');header(s,start,['År','Restgæld før','Rente','Afdrag','Ydelse','Restgæld efter']);
 for(let i=0;i<4;i++) {
  const r=start+1+i;value(s,`B${r}`,i+1);s.getRange(`B${r}`).setNumberFormat(integer);
  formula(s,`C${r}`,i===0?'=$C$7':`=G${r-1}`);
  formula(s,`D${r}`,`=C${r}*$C$8`);
  if(kind==='Annuitet') {formula(s,`F${r}`,'=$C$11');formula(s,`E${r}`,`=F${r}-D${r}`);}
  else {formula(s,`E${r}`,kind==='Serie'?'=$C$7/$C$9':`=IF(B${r}=$C$9,C${r},0)`);formula(s,`F${r}`,`=D${r}+E${r}`);}
  formula(s,`G${r}`,`=C${r}-E${r}`);
 }
}
calc(s,40,'Afdrag i alt, annuitet','=SUM(E16:E19)');calc(s,41,'Afdrag minus hovedstol','=C40-C7',number,'Kontrol: skal være 0,00 kr.');
calc(s,42,'Sidste restgæld, annuitet','=G19',number,'Kontrol: skal være 0,00 kr. (afrundingsstøj kan forekomme).');
header(s,45,['År','Annuitet, kr.','Serie, kr.','Stående, kr.']);
for(let i=0;i<4;i++) {const r=46+i;value(s,`B${r}`,i+1);formula(s,`C${r}`,`=G${16+i}`);formula(s,`D${r}`,`=G${25+i}`);formula(s,`E${r}`,`=G${34+i}`);}
note(s,51,'(c) Stående lån: rente undervejs, hele hovedstolen ved sidste termin.');
note(s,52,'(d) Hovedstolen kommer hurtigst tilbage i serie, derefter annuitet, og sidst stående.');
note(s,53,'Tidligere betalinger giver mindre prisfølsomhed, men mere at genplacere frem til år 4.');
chart(s,'B45:E49','Restgæld efter hver termin','B55','H71','Restgæld, kr.','#,##0');
note(s,72,'Punkterne er restgæld lige efter betaling; linjerne forbinder terminerne.');

s=sheets['2.2'];section(s,6,'Input');
input(s,7,'Indfrielse pr. 100 nominel',100);input(s,8,'År til udløb (fast)',5,integer,false);input(s,9,'Købskurs',90.57);
input(s,10,'Nominel beholdning, kr.',250000);input(s,11,'Ny årlig rente i (c)',.03,percent);input(s,12,'År tilbage i (d) (fast)',3,integer,false);
calc(s,15,'(a) Samlet vækstfaktor','=C7/C9','0.000000','Indfrielse / købspris');
calc(s,16,'Årlig vækstfaktor','=C15^(1/C8)','0.000000','Femteroden fordeler væksten over fem år.');
calc(s,17,'Effektiv årlig rente','=C16-1','0.00000%');total(s,17,'C');
calc(s,19,'(b) Kursværdi, kr.','=C10*C9/100');calc(s,20,'Vedhængende rente, kr.','=0',number,'Ingen kuponer at fordele mellem køber og sælger.');
calc(s,21,'Dirty afregning, kr.','=SUM(C19:C20)');
calc(s,23,'(c) Ny kurs','=C7/(1+C11)^C8');calc(s,24,'Kursændring, point','=C23-C9');
calc(s,25,'(d) Kurs med 3 år tilbage','=C7/(1+C17)^C12');
note(s,28,'(c) Højere markedsrente kræver lavere pris på de samme fremtidige 100 kr.');
note(s,29,'(d) Ved uændret positiv rente stiger kursen mod indfrielsesværdien. Det er pull-to-par.');
header(s,32,['År siden køb','Kurs']);
for(let i=0;i<=5;i++){const r=33+i;value(s,`B${r}`,i);formula(s,`C${r}`,`=$C$7/(1+$C$17)^($C$8-B${r})`);}
chart(s,'B32:C38','Pull-to-par ved uændret rente','B40','H56');

s=sheets['2.3'];section(s,6,'Input');
input(s,7,'Hovedstol pr. 100',100);input(s,8,'Årlig kuponrente',.03,percent);input(s,9,'År til udløb (fast)',4,integer,false);input(s,10,'Købskurs',96.37);
input(s,11,'Rente til indsættelse',.04,percent);input(s,12,'(c) Nominel årsrente',.04,percent);input(s,13,'Terminer i (c) (fast)',4,integer,false);
calc(s,15,'Kupon pr. år','=C7*C8');calc(s,16,'(a) Eksakt effektiv rente','=RATE(C9,C15,-C10,C7)','0.00000%','Købet er negativt; kuponer og indfrielse er positive.');
calc(s,17,'(c) Rente pr. termin','=C12/C13',percent);calc(s,18,'Effektiv årlig rente','=(1+C17)^C13-1','0.000000%');
header(s,22,['År','Kupon','Hovedstol','Betaling i alt','Diskonteringsled','PV ved prøverente','PV ved eksakt y']);
for(let i=0;i<4;i++) {const r=23+i;value(s,`B${r}`,i+1);formula(s,`C${r}`,'=$C$15');formula(s,`D${r}`,`=IF(B${r}=$C$9,$C$7,0)`);formula(s,`E${r}`,`=SUM(C${r}:D${r})`);formula(s,`F${r}`,`=(1+$C$11)^B${r}`,'0.000000');formula(s,`G${r}`,`=E${r}/F${r}`,'0.00000');formula(s,`H${r}`,`=E${r}/(1+$C$16)^B${r}`,'0.00000');}
text(s,27,'Sum af nutidsværdier');formula(s,'G27','=SUM(G23:G26)','0.00000');formula(s,'H27','=SUM(H23:H26)','0.00000');total(s,27);
note(s,29,'(a) Med opgavens oprindelige input giver 4 % en kurs på 96,37010, afrundet 96,37.');
note(s,30,'(b) Køb under pari giver en kursgevinst ud over kuponerne. Effektiv rente er derfor over kuponrenten.');
note(s,31,'Målsøgning: sæt G27 til C10’s købskurs ved at ændre C11. RATE i C16 finder løsningen direkte.');
note(s,32,'(c) Sammenlign på samme grundlag: omregn nominel årsrente til effektiv årsrente.');
header(s,35,['Kvartal','Saldo før','Rente i kvartalet','Saldo efter']);
for(let i=0;i<4;i++){const r=36+i;value(s,`B${r}`,i+1);formula(s,`C${r}`,i===0?'=$C$7':`=E${r-1}`);formula(s,`D${r}`,`=C${r}*$C$17`,'0.000000');formula(s,`E${r}`,`=SUM(C${r}:D${r})`,'0.000000');}
calc(s,42,'Kontrol: årlig vækst','=E39/C7-1','0.000000%');
note(s,44,'Renters rente: den første kvartalsrente tjener også rente i de følgende kvartaler.');

s=sheets['2.4'];section(s,6,'Input');
input(s,7,'Nominel beholdning, kr.',1000000);input(s,8,'Årlig kuponrente',.02,percent);input(s,9,'Terminer pr. år (fast)',4,integer,false);input(s,10,'Clean kurs',98.45);input(s,11,'Forløbne dage, D',50,integer);input(s,12,'Dage i perioden, DT',90,integer);
calc(s,15,'(b) Kupon pr. termin, kr.','=C7*C8/C9');calc(s,16,'Optjent andel af perioden','=C11/C12','0.000000');
calc(s,17,'Vedhængende rente, kr.','=C15*C16');calc(s,18,'Vedhængende, kurspoint','=C17/C7*100','0.000000');
calc(s,20,'(c) Clean kursværdi, kr.','=C7*C10/100');calc(s,21,'Dirty afregning, kr.','=C20+C17');calc(s,22,'Dirty kurs','=C10+C18','0.000000');total(s,21,'C');
calc(s,23,'Købers del af kuponen, kr.','=C15-C17');
note(s,25,'(a) Handelsdag: aftalen indgås. Valørdag: penge og obligation udveksles.');
note(s,26,'Sælger kompenseres for den optjente del frem til valør, fordi køber får hele næste kupon.');
note(s,27,'(d) Faldet i dirty price ved termin modsvares af kuponen. Lavere pris efter termin er ikke en gratis gevinst.');
note(s,28,'Opgaven bruger D/DT af en regelmæssig kupon. D skal ligge mellem 0 og DT. DT skal være positiv.');
header(s,31,['Andel af næste kupon','Kr.']);text(s,32,'Sælgers andel');formula(s,'C32','=C17');text(s,33,'Købers andel');formula(s,'C33','=C23');
chart(s,'B31:C33','Fordeling af næste kupon','B35','H49','Beløb, kr.','#,##0.00','bar');

s=sheets['2.5'];section(s,6,'Input');
input(s,7,'Hovedstol pr. 100',100);input(s,8,'Årlig kuponrente',.05,percent);input(s,9,'År fra start (fast)',6,integer,false);
input(s,10,'Rente 1',.04,percent);input(s,11,'Rente 2',.05,percent);input(s,12,'Rente 3',.06,percent);input(s,13,'År tilbage i (c) (fast)',3,integer,false);calc(s,15,'Årlig kupon','=C7*C8');
note(s,17,'(a) Hver betaling diskonteres separat; summen er kursen. Rentecellerne kan ændres.');
header(s,19,['År','Betaling','PV ved rente 1','PV ved rente 2','PV ved rente 3']);
for(let i=0;i<6;i++){const r=20+i;value(s,`B${r}`,i+1);formula(s,`C${r}`,`=$C$15+IF(B${r}=$C$9,$C$7,0)`);for(const [col,ref] of [['D',10],['E',11],['F',12]])formula(s,`${col}${r}`,`=C${r}/(1+$C$${ref})^B${r}`,'0.00000');}
text(s,26,'Kurs = sum af PV');for(const col of ['D','E','F'])formula(s,`${col}26`,`=SUM(${col}20:${col}25)`);total(s,26,'F');
header(s,28,['Effektiv rente','Kurs','Klassifikation']);
for(let i=0;i<3;i++){let r=29+i;formula(s,`B${r}`,`=C${10+i}`,percent);formula(s,`C${r}`,`=${['D','E','F'][i]}26`);formula(s,`D${r}`,`=IF(ABS(C${r}-$C$7)<0.000001,"Pari",IF(C${r}>$C$7,"Præmie","Discount"))`,'General');}
s.getRange('D29:D31').setNumberFormat('  @');
calc(s,34,'(c) Kurs med 3 år tilbage','=IF(C12=0,C15*C13+C7,C15*(1-(1+C12)^(-C13))/C12+C7/(1+C12)^C13)');
calc(s,35,'Stigning fra kurs ved start','=C34-F26');
note(s,37,'(b) Kupon under markedsrenten kræver discount. Kupon over markedsrenten giver præmie.');
header(s,39,['År siden start','År tilbage','Rente 1: kurs','Rente 2: kurs','Rente 3: kurs']);
for(let i=0;i<=6;i++){const r=40+i;value(s,`B${r}`,i);formula(s,`C${r}`,`=$C$9-B${r}`,integer);for(const [col,ref] of [['D',10],['E',11],['F',12]])formula(s,`${col}${r}`,`=IF($C$${ref}=0,$C$15*C${r}+$C$7,$C$15*(1-(1+$C$${ref})^(-C${r}))/$C$${ref}+$C$7/(1+$C$${ref})^C${r})`);}
const pull=s.charts.add('line',[s.getRange('B39:B46'),s.getRange('D39:D46'),s.getRange('E39:E46'),s.getRange('F39:F46')]);
pull.title='Pull-to-par ved uændrede renter';pull.setPosition('B49','H64');pull.titleTextStyle.typeface='Arial';pull.titleTextStyle.fontSize=15;
pull.legend={position:'top',textStyle:{typeface:'Arial',fontSize:12}};pull.xAxis={axisType:'textAxis',textStyle:{typeface:'Arial',fontSize:11}};pull.yAxis={numberFormatCode:'0.00',numberFormatSourceLinked:false,textStyle:{typeface:'Arial',fontSize:11}};pull.yAxis.title.text='Kurs pr. 100 nominel';
pull.series.items.forEach((ser,i)=>{ser.line={fill:[teal,'#CA7A20',navy][i],style:'solid',width:2};});
note(s,66,'(c) Slutpunktet viser indfrielsesværdien. Alle øvrige kurser er lige efter en kuponbetaling.');
note(s,67,'(d) Samme betalinger på samme dato er billigere til 95 end 105. På tværs af datoer skal markedsrenten med.');
note(s,68,'Sammenlign effektiv rente, risiko, løbetid og rettigheder. Kursen alene afgør ikke, om en obligation er attraktiv.');

s=sheets['2.6'];section(s,6,'Input');input(s,7,'Nominel beholdning, kr.',1000000);input(s,8,'Årlig kuponrente',.06,percent);input(s,9,'År til udløb (fast)',3,integer,false);input(s,10,'Købskurs',100);input(s,11,'Genplacering i (a)',.06,percent);input(s,12,'Genplacering i (b)',.02,percent);
calc(s,14,'Investeret beløb, kr.','=C7*C10/100');calc(s,15,'Årlig kupon, kr.','=C7*C8');calc(s,16,'Effektiv rente ved køb','=RATE(C9,C15,-C14,C7)',percent);
header(s,20,['Modtaget i år','Betaling, kr.','År til genplacering','Faktor ved (a)','Slutværdi (a), kr.','Faktor ved (b)','Slutværdi (b), kr.']);
for(let i=0;i<3;i++){const r=21+i;value(s,`B${r}`,i+1);formula(s,`C${r}`,'=$C$15');formula(s,`D${r}`,`=$C$9-B${r}`,integer);formula(s,`E${r}`,`=(1+$C$11)^D${r}`,'0.000000');formula(s,`F${r}`,`=C${r}*E${r}`);formula(s,`G${r}`,`=(1+$C$12)^D${r}`,'0.000000');formula(s,`H${r}`,`=C${r}*G${r}`);}
text(s,24,'Hovedstol ved udløb');formula(s,'C24','=C7');formula(s,'D24','=0',integer);formula(s,'E24','=1','0.000000');formula(s,'F24','=C24*E24');formula(s,'G24','=1','0.000000');formula(s,'H24','=C24*G24');
text(s,25,'Samlet slutformue');formula(s,'F25','=SUM(F21:F24)');formula(s,'H25','=SUM(H21:H24)');total(s,25);
calc(s,27,'(a) Årligt afkast','=(F25/C14)^(1/C9)-1','0.0000%');calc(s,28,'(c) Årligt afkast i (b)','=(H25/C14)^(1/C9)-1','0.0000%');
calc(s,29,'Under YTM, procentpoint','=(C16-C28)*100','0.0000');calc(s,30,'Formue ved forrentning til y','=C14*(1+C16)^C9');calc(s,31,'Slutformue (a) minus dette','=F25-C30',number,'Nul, når genplaceringsrenten i (a) er lig YTM.');
note(s,33,'(d) Hold til udløb og genplacér alle mellemliggende betalinger til YTM fra købet.');
note(s,34,'Forudsætter også aftalte betalinger, ingen skat og ingen handelsomkostninger.');
note(s,35,'Ved samme hovedstol, kupon, løbetid og horisont ved udløb skal serie/annuitet også genplacere afdrag.');
note(s,36,'Flere tidlige betalinger giver større eksponering mod genplaceringsrenten. Højere kupon øger den, alt andet lige.');
note(s,37,'Stående lån genplacerer kun kuponer. Nulkupon har ingen genplaceringsrisiko frem til eget udløb.');
header(s,38,['Genplacering','Samlet rente på kuponer, kr.']);s.getRange('C38').format.wrapText=true;s.getRange('B38:C38').format.rowHeight=40;
text(s,39,'Til renten i (a)');formula(s,'C39','=F25-C7-SUM(C21:C23)');text(s,40,'Til renten i (b)');formula(s,'C40','=H25-C7-SUM(C21:C23)');
chart(s,'B38:C40','Genplaceringsrente tjent frem til år 3','B42','H56','Renteindtægt, kr.','#,##0','bar');

s=sheets['2.7'];section(s,6,'Input');input(s,7,'Indfrielse pr. 100 nominel',100);input(s,8,'K: år til udløb (fast)',2,integer,false);input(s,9,'L: år til udløb (fast)',20,integer,false);input(s,10,'Rente ved start',.04,percent);input(s,11,'Rente efter stigning',.06,percent);input(s,12,'Rente efter fald',.02,percent);
header(s,15,['(a) Scenario','Rente','K: kurs','L: kurs','K: ændring i %','L: ændring i %']);
for(const [r,label,ref] of [[16,'Udgangspunkt',10],[17,'Rentestigning',11],[18,'Rentefald',12]]) {text(s,r,label);formula(s,`C${r}`,`=C${ref}`,percent);formula(s,`D${r}`,`=$C$7/(1+C${r})^$C$8`);formula(s,`E${r}`,`=$C$7/(1+C${r})^$C$9`);formula(s,`F${r}`,`=D${r}/$D$16-1`,percent);formula(s,`G${r}`,`=E${r}/$E$16-1`,percent);}
calc(s,21,'(c) L: gevinst, kurspoint','=E18-E16');calc(s,22,'L: tab, kurspoint','=E16-E17');calc(s,23,'Gevinst minus tab, point','=C21-C22');
note(s,25,'(b) L diskonteres i 20 år, K i to. Renten virker gennem langt flere perioder for L.');
note(s,26,'(c) Ved lavere rente bliver kurven stejlere; ved højere rente fladere. Det er konveksitet.');
calc(s,28,'(d) Modificeret varighed, L','=C9/(1+C10)','0.0000');
input(s,29,'Lille renteændring',.0001,'0.00%');calc(s,30,'Anslået kursændring, L','=-C28*C29','0.0000%');
note(s,32,'(d) Modificeret varighed måler lokal prisfølsomhed. Konveksitet beskriver kurvens krumning.');
header(s,35,['Årlig effektiv rente','K: kurs','L: kurs']);
for(let i=0;i<8;i++){const r=36+i;value(s,`B${r}`,(i+1)/100);s.getRange(`B${r}`).setNumberFormat(percent);formula(s,`C${r}`,`=$C$7/(1+B${r})^$C$8`);formula(s,`D${r}`,`=$C$7/(1+B${r})^$C$9`);}
text(s,35,'Rente på grafens akse','H');
for(let r=36;r<=43;r++)formula(s,`H${r}`,`=TEXT(B${r},"0%")`,'General');
chart(s,'B35:D43','Kurs og årlig effektiv rente','B46','H62');

s=sheets['2.8'];section(s,6,'Kurslistens oplysninger');header(s,7,['Obligation','Clean kurs','Årlig kupon','Terminer pr. år']);
text(s,8,'X');text(s,9,'Y');s.getRange('C8:E9').values=[[101.2,.03,1],[99.1,.03,4]];
s.getRange('C8:D9').format.font.color=blue;s.getRange('C8:D9').format.fill=amber;
s.getRange('C8:C9').setNumberFormat(number);s.getRange('D8:D9').setNumberFormat(percent);s.getRange('E8:E9').format.fill='#F1F3F5';s.getRange('E8:E9').setNumberFormat(integer);
input(s,11,'Nominel beholdning i X, kr.',300000);
input(s,12,'Optjent andel f (valgfri)',null,percent);text(s,12,'Tom = valør mangler. 0 = ingen optjent rente.','E');
calc(s,15,'(a) Y: kupon pr. termin','=100*D9/E9');calc(s,16,'Y: kuponer pr. år','=C15*E9');
calc(s,18,'Årlig rente ved pari for Y','=(1+D9/E9)^E9-1','0.0000%');
note(s,20,'(b) Med de oprindelige kurser er svaret Y: under pari giver kursgevinst ud over kuponerne.');
note(s,21,'Ved indfrielse til 100 er Y’s terminsrente over kupon pr. termin, og årsrenten over C18.');
note(s,22,'Med opgavens oprindelige tal har X en effektiv årsrente under 3 %. Præcis YTM kræver løbetid og betalingsprofil.');
calc(s,24,'(c) Clean kursværdi, kr.','=C11*C8/100');calc(s,25,'X: årlig kupon, kr.','=C11*D8');
calc(s,26,'Kupon pr. termin i X, kr.','=C25/E8');
calc(s,27,'Vedhængende rente, kr.','=IF(ISBLANK(C12),"Valør mangler",C26*C12)');
calc(s,28,'Dirty afregning, kr.','=IF(ISBLANK(C12),"Valør mangler",C24+C27)');total(s,28,'C');
note(s,30,'(c) Opgaven giver ikke den optjente andel. Derfor står afregningsbeløbet åbent.');
note(s,31,'Indtast fx 50 % i C12 for at undersøge en halv kuponperiode, eller 0 % lige efter termin.');
note(s,32,'f skal være mellem 0 og 1. Det valgfri forsøg er ikke en ekstra oplysning fra opgaven.');
note(s,34,'Kursværdi og afregning er kun ens, når vedhængende rente er nul, og der ikke er handelsomkostninger.');

// Minimal input validation without hiding erroneous formulas.
sheets['2.4'].getRange('C11').dataValidation={rule:{type:'whole',operator:'between',formula1:0,formula2:'$C$12'}};
sheets['2.4'].getRange('C12').dataValidation={rule:{type:'whole',operator:'greaterThan',formula1:0}};
sheets['2.8'].getRange('C12').dataValidation={rule:{type:'decimal',operator:'between',formula1:0,formula2:1}};
for(const [name,cell] of [['2.1','C41'],['2.1','C42']])sheets[name].getRange(cell).conditionalFormats.addCustom(`ABS(${cell})>0.01`,{fill:'#FCE4D6',font:{color:'#B00020',bold:true}});

wb.recalculate();
const expected=[['2.1','C11',564023.6652069251],['2.1','G19',0],['2.1','F28',525000],['2.1','F37',2100000],
 ['2.2','C17',.02000693951615462],['2.2','C19',226425],['2.2','C23',100/1.03**5],['2.2','C25',100/(100/90.57)**.6],
 ['2.3','C16',.040000295613751624],['2.3','G27',96.370104775757],['2.3','C18',1.01**4-1],
 ['2.4','C17',5000*50/90],['2.4','C21',984500+5000*50/90],
 ['2.5','F26',5*(1-1.06**-6)/.06+100/1.06**6],['2.5','C34',5/1.06+5/1.06**2+105/1.06**3],
 ['2.6','F25',1191016],['2.6','H25',1183624],['2.6','C28',.057802496238086976],
 ['2.7','G17',(1.04/1.06)**20-1],['2.7','G18',(1.04/1.02)**20-1],
 ['2.8','C15',.75],['2.8','C24',303600]];
const check=[];
for(const [name,cell,want] of expected){const got=sheets[name].getRange(cell).values[0][0];if(typeof got!=='number'||Math.abs(got-want)>Math.max(1e-7,Math.abs(want)*1e-9))throw Error(`${name}!${cell}: ${got} != ${want}`);check.push({sheet:name,cell,value:got,expected:want});}
// Representative change/recalculate/restore checks, including blank versus zero.
value(sheets['2.1'],'C8',0);wb.recalculate();if(sheets['2.1'].getRange('C11').values[0][0]!==500000)throw Error('Zero-rate annuity');
value(sheets['2.1'],'C8',.05);
value(sheets['2.6'],'C12',.06);wb.recalculate();if(Math.abs(sheets['2.6'].getRange('H25').values[0][0]-1191016)>.001)throw Error('Reinvestment change');value(sheets['2.6'],'C12',.02);
for(const [v,want] of [[null,'Valør mangler'],[0,303600],[.5,308100]]) {value(sheets['2.8'],'C12',v);wb.recalculate();const got=sheets['2.8'].getRange('C28').values[0][0];if(got!==want)throw Error(`Accrued-interest input ${v}: ${got}`);}
value(sheets['2.8'],'C12',null);wb.recalculate();
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},summary:'Formula errors',maxChars:3000});
await fs.writeFile(path.join(qa,'formula-errors.ndjson'),errors.ndjson);
console.log(errors.ndjson);
for(const [name,cell] of formulaCells){const v=sheets[name].getRange(cell).values[0][0];if(typeof v==='string'&&/^#(REF|DIV|VALUE|NAME|N\/A|NUM|NULL|SPILL|CALC)/.test(v))throw Error(`Formula error ${name}!${cell}: ${v}`);}
const inspection=await wb.inspect({kind:'table',range:"'2.6'!B20:H31",include:'values,formulas',tableMaxRows:12,tableMaxCols:7,maxChars:5000});
await fs.writeFile(path.join(qa,'key-range.ndjson'),inspection.ndjson);
const bindings=[];
for(const name of Object.keys(sheets))for(const ch of sheets[name].charts.items)bindings.push({sheet:name,title:ch.title.text,series:ch.series.items.map(z=>({formula:z.formula,categoryFormula:z.categoryFormula}))});
await fs.writeFile(path.join(qa,'checks.json'),JSON.stringify({results:check,inputChanges:'Zero-rate annuity, changed reinvestment rate, blank/zero/half accrued share: passed',charts:bindings},null,2));
const xlsx=await SpreadsheetFile.exportXlsx(wb);
const filename=path.join(out,'kapitel-02-beregninger.xlsx');await xlsx.save(filename);console.log('Saved '+filename);
for(const [name,sh] of Object.entries(sheets)) {
  const blob=await wb.render({sheetName:name,range:`A1:I${extents[name]}`,scale:1,format:'png'});
  await fs.writeFile(path.join(qa,`${name}.png`),new Uint8Array(await blob.arrayBuffer()));console.log('Rendered '+name);
}
