import { printServices } from "@/lib/print-services";
import { giftImageFor } from "@/lib/gift-images";
import { indicativePrice } from "@/lib/indicative-prices";
import { notebookProducts, notebookImageFor } from "@/lib/notebooks";
import { retailDepartments } from "@/lib/retail-departments";
import { stationeryCollections, stationeryHighlights } from "@/lib/stationery";
import { departmentDirectory } from "@/lib/catalog";
export type PublicProduct = { key:string; name:string; department:string; id:string; price:number|null; unit:string; image?:string; description:string; aliases:string; available?:boolean; startingPrice?:boolean; estimatedPrice?:boolean; departmentIds?:string[] };
export function normalizeSearch(text:string) {
  return text.toLowerCase().replace(/\bdairies\b/g,"diaries").replace(/blur\b/g,"blue").replace(/blach\b/g,"black").replace(/pends?\b/g,"pen").replace(/(\d)([a-z])/g,"$1 $2").replace(/([a-z])(\d)/g,"$1 $2").replace(/\bcolour/g,"color").replace(/\bcolours/g,"colors").replace(/notebooks?|notes?\b/g,"notebook").replace(/\blong books?\b/g,"long notebook").replace(/\bshort books?\b/g,"short notebook").replace(/\bpages?\b/g,"page").replace(/\bpens\b/g,"pen").replace(/[^a-z0-9]+/g," ").trim();
}
export function matchesProduct(product:PublicProduct, query:string) {
  if (/\bruled\b/i.test(query)&&!/unruled/i.test(query)&&/unruled/i.test(product.name))return false;
  const haystack=normalizeSearch(`${product.name} ${product.description} ${product.aliases} ${product.department}`);
  return normalizeSearch(query).split(/\s+/).filter(Boolean).every(token=>haystack.includes(token));
}
export const catalogExamples:PublicProduct[] = [
 ...printServices.map(service=>({key:`service-${service.name}`,name:service.name,department:"Print & Xerox",id:"print-xerox",price:service.price,unit:service.unit,description:service.description,aliases:["printing photocopy xerox document services",...service.aliases].join(" "),image:service.image,startingPrice:!service.unit,available:true})),
 ...Object.values(retailDepartments).flatMap(department=>department.groups.flatMap(group=>group.items.map(item=>({key:`retail-${department.id}-${item.name}`,name:item.name,department:department.title,id:department.id,price:item.price,unit:"",description:item.description,aliases:group.title+(department.id==="gift-items"?(group.title.includes("Wedding")?" marriage marriages shaadi anniversary":group.title.includes("Housewarming")?" house warming gruhapravesam":group.title.includes("Party")?" party parties celebration":" birthday gifting gifts"):""),image:`/images/${department.id==='office-supplies'?'office':department.id==='gift-items'?'gifts':'daily-needs'}/${item.image}.webp`,startingPrice:item.price!==null,estimatedPrice:department.id==="gift-items"})))),
 ...stationeryHighlights.map(item=>({key:`highlight-${item.name}`,name:item.name,department:"Stationery & school supplies",id:"school-supplies",price:item.price,unit:"",description:item.description,aliases:item.name,image:`/images/stationery/${item.image}.webp`,startingPrice:true})),
 ...stationeryCollections.flatMap(group=>group.items.map(item=>({key:`priced-${item.name}`,name:item.name,department:"Stationery & school supplies",id:"school-supplies",price:item.price,unit:"",description:`${group.title}. Options and brands vary; visit the shop for details.`,aliases:group.title,image:group.image,startingPrice:item.price!==null}))),
  ...notebookProducts.map(item=>({key:`notebooks-${item.name}`,name:item.name,department:"Note Books Collection",id:"notebooks",price:null,unit:"piece",description:item.description,aliases:item.aliases,image:notebookImageFor(item.name)})),
  ...["Blue","Black"].flatMap(color=>["Ball","Gel"].map(type=>({key:`pen-${color}-${type}`,name:`${color} ${type} Pen`,department:"Stationery & school supplies",id:"school-supplies",price:type==="Ball"?10:15,startingPrice:true,unit:"",description:`${color} ink ${type.toLowerCase()} pen. Ask for available brands and tip sizes.`,aliases:`pens writing ${color} ink`,image:color==="Blue"?"/images/stationery/cello-pen.webp":"/images/stationery/black-pen.webp"}))),
  ...departmentDirectory.flatMap(department=>department.items.filter(name=>!["Pens","Pencils","Markers","Office Files","A4 Papers","File Folders","Colored Papers","Printer Paper","Ledgers","Desk Organizers","Chocolates","Biscuits","Snacks","School Accessories","Refill Pens","Craft Sheets"].includes(name)).map(name=>({key:`${department.id}-${name}`,name,department:department.title,id:department.id,price:null,unit:"",description:"Contact the shop for current options and availability.",aliases:name,image:/envelope/i.test(name)?"/images/stationery/envelope.webp":undefined})))
];
function stationeryImageFor(name:string){
 const n=name.toLowerCase();
 if(/stamp/.test(n))return "/images/stationery/office-stamp.webp";
 if(/sticky/.test(n))return "/images/stationery/sticky-notes.webp";
 if(/chalk/.test(n))return "/images/stationery/chalk-pieces.webp";
 if(/duster/.test(n))return "/images/stationery/duster.webp";
 if(/paper|letter head/.test(n))return "/images/stationery/a4-paper.webp";
 if(/file|folder/.test(n))return "/images/stationery/display-file.webp";
 if(/protractor/.test(n))return "/images/stationery/geometry-box.webp";
 return undefined;
}
export function canonicalProductName(name:string){return normalizeSearch(name).replace(/\bwhite board\b/g,"whiteboard").replace(/\bprotractors\b/g,"protractor").replace(/\bbottles\b/g,"bottle").replace(/\bbooks\b/g,"book").replace(/\b(files|staplers|calculators|registers|folders|papers|machines|clips|drives|batteries)\b/g,word=>word==='batteries'?'battery':word.slice(0,-1)).replace(/\bboxes\b/g,'box');}
export function mergePublicProducts(saved:PublicProduct[]) {
 const merged=new Map<string,PublicProduct>();
 for(let original of [...saved.map(item=>({...item,startingPrice:false,estimatedPrice:false})),...catalogExamples]){const service=printServices.find(service=>[service.name,...service.aliases].some(name=>canonicalProductName(name)===canonicalProductName(original.name)));original=service?{...original,name:service.name,image:original.image&&!original.image.endsWith(".svg")?original.image:service.image}:original;const estimate=original.price===null?indicativePrice(original.name,original.id):null;const raw=estimate===null?original:{...original,price:estimate,startingPrice:true,estimatedPrice:true};const isNotebook=raw.id!=="print-xerox"&&(raw.id==="notebooks"||(!/sticky|label|cover/i.test(raw.name)&&/book|note|diar|record|register|binding/i.test(raw.name)));const item={...raw,image:raw.image&&!raw.image.endsWith(".svg")?raw.image:raw.id==="print-xerox"?service?.image||"/images/home/printing.webp":raw.id==="money-transfer"?"/images/home/money-transfer-service.webp":isNotebook?notebookImageFor(raw.name):raw.id==="gift-items"?giftImageFor(raw.name):raw.id==="school-supplies"?stationeryImageFor(raw.name):raw.image,departmentIds:[...new Set([...(raw.departmentIds||[raw.id]),...(isNotebook?["notebooks"]:[])])]};const key=canonicalProductName(item.name);const previous=merged.get(key);if(previous){merged.set(key,{...previous,image:previous.image||item.image,aliases:previous.aliases+' '+item.name+' '+item.aliases,departmentIds:[...new Set([...(previous.departmentIds||[previous.id]),...(item.departmentIds||[item.id])])]});}else merged.set(key,{...item,departmentIds:item.departmentIds||[item.id]});}
 const confirmedPrices:PublicProduct[]=[
  {key:"confirmed-amul-curd-400g",name:"Amul Curd 400g",department:"Milk & Dairy",id:"milk-dairy",price:40,unit:"",image:"/images/daily-needs/curd.webp",description:"Amul curd, 400 g pack.",aliases:"amul curd dairy",startingPrice:false,estimatedPrice:false},
  {key:"confirmed-water-bottle",name:"Water Bottle",department:"Daily Needs",id:"daily-needs",price:10,unit:"",image:"/images/daily-needs/water-bottle.webp",description:"Packaged drinking water bottle.",aliases:"water bottles packaged drinking water",startingPrice:false,estimatedPrice:false},
  {key:"confirmed-long-notebook",name:"Long Notebook",department:"Note Books Collection",id:"notebooks",price:35,unit:"",image:"/images/notebooks/long-100.webp",description:"Long notebook. Ask in store for available brands and page counts.",aliases:"long book notebook",startingPrice:false,estimatedPrice:false}
 ];
 for(const product of confirmedPrices){const key=canonicalProductName(product.name);const existing=merged.get(key);merged.set(key,{...existing,...product,departmentIds:[...new Set([...(existing?.departmentIds||[]),product.id])]});}
 return [...merged.values()];
}
export function priceLabel(product:PublicProduct) { return product.price===null ? "Ask for price" : `${product.startingPrice ? "Starting from " : ""}\u20b9${product.price.toLocaleString("en-IN",{maximumFractionDigits:2})}${product.unit ? ` / ${product.unit}` : ""}`; }
