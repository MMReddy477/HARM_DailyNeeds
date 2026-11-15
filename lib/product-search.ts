import { departmentDirectory } from "@/lib/catalog";
export type PublicProduct = { key:string; name:string; department:string; id:string; price:number|null; unit:string; image?:string; description:string; aliases:string; available?:boolean };
export function normalizeSearch(text:string) {
  return text.toLowerCase().replace(/blur\b/g,"blue").replace(/blach\b/g,"black").replace(/pends?\b/g,"pen").replace(/(\d)([a-z])/g,"$1 $2").replace(/([a-z])(\d)/g,"$1 $2").replace(/notebooks?|notes?\b/g,"notebook").replace(/\blong books?\b/g,"long notebook").replace(/\bshort books?\b/g,"short notebook").replace(/\bpages?\b/g,"page").replace(/\bpens\b/g,"pen").replace(/[^a-z0-9]+/g," ").trim();
}
export function matchesProduct(product:PublicProduct, query:string) {
  const haystack=normalizeSearch(`${product.name} ${product.description} ${product.aliases} ${product.department}`);
  return normalizeSearch(query).split(/\s+/).filter(Boolean).every(token=>haystack.includes(token));
}
export const catalogExamples:PublicProduct[] = [
  ...[100,200,300,400].flatMap(pages=>["Long","Short"].map(size=>({key:`notebook-${size}-${pages}`,name:`${size} Notebook - ${pages} Pages`,department:"Stationery & school supplies",id:"school-supplies",price:null,unit:"piece",description:`${pages}-page ${size.toLowerCase()} notebook. Ask for available brands and ruling.`,aliases:`notebooks school writing ${size.toLowerCase()}`,image:"/product-images/notebook.svg"}))),
  ...["Blue","Black"].flatMap(color=>["Ball","Gel"].map(type=>({key:`pen-${color}-${type}`,name:`${color} ${type} Pen`,department:"Stationery & school supplies",id:"school-supplies",price:null,unit:"piece",description:`${color} ink ${type.toLowerCase()} pen. Ask for available brands and tip sizes.`,aliases:`pens writing ${color} ink`,image:"/product-images/blue-pens.svg"}))),
  ...departmentDirectory.flatMap(department=>department.items.map(name=>({key:`${department.id}-${name}`,name,department:department.title,id:department.id,price:null,unit:"",description:"Contact the shop for current options and availability.",aliases:name})))
];
export function mergePublicProducts(saved:PublicProduct[]) {
  const names=new Set(saved.map(item=>normalizeSearch(item.name)));
  return [...saved,...catalogExamples.filter(item=>!names.has(normalizeSearch(item.name)))];
}
export function priceLabel(product:PublicProduct) { return product.price===null ? "Price not set" : `\u20b9${product.price.toLocaleString("en-IN",{maximumFractionDigits:2})}${product.unit ? ` / ${product.unit}` : ""}`; }
