/** Indicative retail estimates reviewed 2026-11-16. Owner-saved prices take priority. */
export function indicativePrice(name:string,department=''):number|null {
 const n=name.toLowerCase();
 if(department==='money-transfer'||department==='print-xerox')return null;
 const pages=Number(n.match(/(100|172|200)\s*(?:pages?)?/i)?.[1]||0);
 if(pages&&/book|note/.test(n)){const base=/long/.test(n)?{100:35,172:55,200:65}:/short/.test(n)?{100:25,172:40,200:50}:{100:20,172:30,200:40};return base[pages as 100|172|200];}
 if(/pocket|memo|small book/.test(n))return 30;
 if(/diar/.test(n))return 80;
 if(/spiral|comb binding|soft binding/.test(n))return 50;
 if(/thermal|project binding/.test(n))return 80;
 if(/drawing|colouring|coloring|activity/.test(n))return 35;
 if(/sketch/.test(n))return 60;
 if(/graph/.test(n))return 30;
 if(/practical|observation|lab record|project record|class work record/.test(n))return 60;
 if(/register|ledger/.test(n))return 80;
 if(/book|note|record/.test(n))return 40;
 if(/eraser|sharpener|chalk/.test(n))return 5;
 if(/pencil box/.test(n))return 50;
 if(/pencil/.test(n))return /mechanical|drawing/.test(n)?20:5;
 if(/roller|permanent marker|whiteboard marker|white board marker/.test(n))return 25;
 if(/refill/.test(n))return 5;
 if(/pen|marker/.test(n))return 10;
 if(/set square|protractor/.test(n))return 15;
 if(/mathematical/.test(n))return 80;
 if(/glitter|sticker paper/.test(n))return 10;
 if(/poster colou?r/.test(n))return 80;
 if(/fevicol/.test(n))return 20;
 if(/duster/.test(n))return 25;
 if(/sticky note/.test(n))return 30;
 if(/envelope/.test(n))return 5;
 if(/office stamp/.test(n))return 100;
 if(/letter head/.test(n))return 5;
 if(/file|folder/.test(n))return 30;
 if(/lunch|tiffin/.test(n))return 150;
 if(/school water|reusable.*bottle/.test(n))return 100;
 if(/cover|book label/.test(n))return 20;
 if(/soft toy/.test(n))return 150;
 if(/greeting|card/.test(n))return 20;
 if(/key chain/.test(n))return 30;
 if(/coffee mug/.test(n))return 100;
 if(/frame/.test(n))return 120;
 if(/gift wrapping/.test(n))return 20;
 if(/gift/.test(n))return 100;
 if(/milk/.test(n))return 35;
 if(/curd/.test(n))return 40;
 return 25;
}
