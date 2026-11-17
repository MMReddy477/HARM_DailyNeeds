import { printServices } from "@/lib/print-services";
import { canonicalProductName, mergePublicProducts } from "@/lib/product-search";

export const printCounterRates = printServices.map(service=>({...service,unit:service.unit||(/Binding/.test(service.name)?"book":/Lamination/.test(service.name)?"sheet":"order")}));
export const stationeryCounterNames = ["Blue Ball Pen", "Black Gel Pen", "Long Notebook - 100 Pages", "Long Notebook - 200 Pages", "Short Notebook - 100 Pages", "Geometry Box", "Display File", "A4 Paper Pack", "Staplers", "Nataraj Pencil Pack"];

export type CounterInventoryItem = { id: string; name: string; category: string; price: number; unit: string; image: string; stock: number };
export function counterRateGroups(inventory: CounterInventoryItem[]) {
    const products = mergePublicProducts(inventory.map(item => ({ key: item.id, name: item.name, department: item.category, id: "saved-inventory", price: item.price, unit: item.unit, image: item.image, description: item.name, aliases: item.category })));
    const print = printCounterRates.map(rate => {
      const names = [rate.name, ...rate.aliases].map(canonicalProductName);
      const saved = inventory.find(item => names.includes(canonicalProductName(item.name)));
      return { name: rate.name, price: saved?.price ?? rate.price, unit: saved?.unit || rate.unit, description: rate.description, saved: !!saved };
    });
    const stationery = stationeryCounterNames.map(name => products.find(product => canonicalProductName(product.name) === canonicalProductName(name))).filter(product => product !== undefined).filter(product => product.price !== null).map(product => ({ name: product.name, price: product.price!, unit: product.unit || "piece", description: product.description, saved: inventory.some(item => item.id === product.key) }));
    return { print, stationery };
  }
