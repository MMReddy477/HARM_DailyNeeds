import type { Product } from "@/lib/types";

const IMAGE_BASE =
  "https://static.prod-images.emergentagent.com/jobs/a22da722-1531-450f-80dd-4e90a44395d3/images";

interface FeaturedProduct {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  unit: string;
  image: string;
  description: string;
}

function product(item: FeaturedProduct, flag: "best" | "new"): Product {
  return {
    ...item,
    image: `${IMAGE_BASE}/${item.image}.jpeg`,
    stock: 0,
    is_best_seller: flag === "best",
    is_new: flag === "new",
    available: false,
    cost_price: 0,
    reorder_level: 0,
    expiry_date: "",
    created_at: "",
    updated_at: "",
  };
}

const BEST_SELLERS: FeaturedProduct[] = [
  { id: "classmate-long-book", name: "Classmate Long Book 172 Pages", category: "Note Books", subcategory: "Long Books", brand: "Classmate", price: 60, unit: "per piece", image: "76b1c69ce704b01ac539d97c5101bca57c356c99c2a4ef9bb29e512deda8b5e9", description: "Soft-cover long notebook with premium 70 GSM ruled paper." },
  { id: "classmate-king-size", name: "Classmate King Size Book 230 Pages", category: "Note Books", subcategory: "Long Books", brand: "Classmate", price: 90, unit: "per piece", image: "658a7a3ef42954bcaa8628b6bff736c33251aeee81df5c4d314e60b0de9621ca", description: "Extra-large king size notebook for detailed notes and projects." },
  { id: "classmate-single-ruled", name: "Classmate School Notes Single Rule 172 Pgs", category: "Note Books", subcategory: "School Notes", brand: "Classmate", price: 55, unit: "per piece", image: "f1c5f100e63f7497e12188e386db3ae2f883e5dad58a9c245c18d62514d74d46", description: "Single rule school notes book, the everyday classroom essential." },
  { id: "drawing-book-a3", name: "Classmate Drawing Book A3", category: "Note Books", subcategory: "Drawing Books", brand: "Classmate", price: 80, unit: "per piece", image: "d5893ed6bc47b20515f12b4bca47587bb63b429f42ac82e394702cd055d654ad", description: "Large A3 drawing book with smooth thick white sheets." },
  { id: "cello-ball-pens", name: "Cello Ball Pen Pack (Blue, 10 Pcs)", category: "Stationery", subcategory: "Pens & Writing", brand: "Cello", price: 50, unit: "per pack", image: "54e2e3fe9cbd5354e4a70d8e511aef7c85024fd08f926b1fdd428990144860de", description: "Smooth-flow blue ball pens in a value pack of ten." },
  { id: "reynolds-pen", name: "Reynolds 045 Trimax Pen (Pack of 5)", category: "Stationery", subcategory: "Pens & Writing", brand: "Reynolds", price: 35, unit: "per pack", image: "a42ca8c709db46bf7d5b4a9a5b37d5d1e91a6876986c80ea14f109364e0a5bfe", description: "The classic 0.45mm fine-trimax writing pen every exam needs." },
  { id: "nataraj-pencils", name: "Nataraj 621 Pencils (Pack of 10)", category: "Stationery", subcategory: "Pens & Writing", brand: "Nataraj", price: 40, unit: "per pack", image: "21cb5a0e8fdf2eaf7e2bead015c957ebdcca05e4648785837fc20c7eafd42e7b", description: "India's most trusted pencil — strong bonded lead, pack of 10." },
  { id: "faber-oil-pastels", name: "Faber-Castell Oil Pastels (25 Shades)", category: "Stationery", subcategory: "Art & Craft", brand: "Faber-Castell", price: 95, unit: "per set", image: "9f8bf891cc0659597b7ae2507d47503cf6088646e09766a524d49aed46f8e1b4", description: "Rich, blendable oil pastels in 25 vibrant shades." },
  { id: "a4-paper-ream", name: "JK Copier A4 Paper (500 Sheets)", category: "Stationery", subcategory: "Papers & Labels", brand: "JK Paper", price: 280, unit: "per ream", image: "dd437fa517b49977a0ef66c8e774e0fb47cb62fa5be2793690a841b8f35c4d6e", description: "75 GSM jam-free A4 copier paper, one full ream." },
  { id: "attendance-register", name: "Staff Attendance Register", category: "Office Supplies", subcategory: "Registers", brand: "Standard", price: 120, unit: "per piece", image: "a6dfe5a12856d07bdc6dc8005a6bcb164437ada1565271f6fa3d0bfc7d011123", description: "Hardbound month-wise attendance register for offices and shops." },
  { id: "casio-calculator", name: "Casio MJ-12D Desktop Calculator", category: "Office Supplies", subcategory: "Calculators", brand: "Casio", price: 575, unit: "per piece", image: "5842b2cdb82b96fb0fa2abb2abb0fe26e9aa806568bc3d19aa2b4082286d679d", description: "12-digit desktop calculator with tax and profit keys." },
  { id: "chocolate-pack", name: "Premium Milk Chocolate Bar", category: "Daily Needs", subcategory: "Chocolates", brand: "", price: 80, unit: "per bar", image: "2b2896f7e517aba4f70b82aebec65e9ee8a5975fd679f7a90d25f918de066be9", description: "Smooth, rich milk chocolate bar — a bestseller at the counter." },
  { id: "biscuit-pack", name: "Glucose Biscuit Family Pack", category: "Daily Needs", subcategory: "Biscuits", brand: "", price: 35, unit: "per pack", image: "3cd0394d57696f6bb50e29b173b2c241d5efad4012c68ee878aa2ec10669be77", description: "Crispy glucose biscuits, family size pack." },
  { id: "wired-earphones", name: "Wired Earphones with Mic", category: "Daily Needs", subcategory: "Earphones", brand: "", price: 150, unit: "per piece", image: "4abcfe65e4b88f0c25437277a8e727344cce2fdad226b908b768dea01edb015d", description: "Clear-sound in-ear earphones with an inline microphone." },
  { id: "pen-gift-set", name: "Premium Pen Gift Set", category: "Gift Shop", subcategory: "Gift Sets", brand: "", price: 299, unit: "per set", image: "45de0954baa8528aa8d277af9273b11e9251812bb785a8263a67b2dc09dce7fd", description: "Twin metallic pens in a satin-lined presentation box." },
  { id: "art-gift-kit", name: "Art & Craft Gift Kit", category: "Gift Shop", subcategory: "Creative Kits", brand: "", price: 349, unit: "per kit", image: "54f67b8289f419b87149dee98b3f041bc6a84f904a9038c0ed6f79b15a50a73e", description: "Complete creative kit: sketchpad, pencils, brushes and more." },
  { id: "milk-packet", name: "Toned Milk Packet 500ml", category: "Milk & Dairy", subcategory: "Milk", brand: "Vijaya", price: 28, unit: "per packet", image: "449dfd520e511cc3176cfb3170112ce93184b3e92aac72dfeaf59e1cf60299fc", description: "Fresh pasteurised toned milk, delivered every morning." },
  { id: "spiced-buttermilk", name: "Spiced Buttermilk 500ml", category: "Milk & Dairy", subcategory: "Buttermilk", brand: "", price: 20, unit: "per pouch", image: "5f433c675144bcd1a1609e8d9dda86af2fce5b717924a6fd9e0a79b8fd75d9d9", description: "Chilled, lightly spiced buttermilk for a refreshing everyday drink." },
];

const NEW_ARRIVALS: FeaturedProduct[] = [
  { id: "navneet-long-book", name: "Navneet Long Notebook 200 Pages", category: "Note Books", subcategory: "Long Books", brand: "Navneet", price: 65, unit: "per piece", image: "2f58c4c8e63e4fd29c5ccac708c977e801c84ba371e37346be74a01a84b79b55", description: "Classic Navneet long book, strong binding and clean ruling." },
  { id: "spiral-notebook", name: "Spiral Bound Notebook A5", category: "Note Books", subcategory: "Spiral Binding", brand: "Sundaram", price: 45, unit: "per piece", image: "8ce361b76207da486d6a291eceabaebc0243578161e8aa6c61f6c60f136faacd", description: "Sturdy A5 spiral notebook that lays flat while writing." },
  { id: "camlin-geometry-box", name: "Camlin Geometry Instrument Box", category: "Stationery", subcategory: "Geometry", brand: "Camlin", price: 110, unit: "per box", image: "c8004222bb52a12ee6dc9ffa43371c83e83fbe4b113ced8d17f62f05fcdfad5e", description: "Complete metal geometry set: compass, divider, set squares, protractor." },
  { id: "sticky-notes", name: "3M Post-it Sticky Notes", category: "Stationery", subcategory: "Office Accessories", brand: "3M Post-it", price: 55, unit: "per pad", image: "e76154ded4a6f22c991fa181ab481f1e2312d5277cd411f6177fe16e40c39db3", description: "Original re-adherable sticky notes in assorted colours." },
  { id: "highlighters", name: "Faber-Castell Highlighter Set (4 Pcs)", category: "Stationery", subcategory: "Pens & Writing", brand: "Faber-Castell", price: 120, unit: "per set", image: "2ead95d82ede9c3bdbc7c45080adf93743b5e36f7f5d19304f97b87fbfc9f0b7", description: "Chisel-tip fluorescent highlighters for smart study." },
  { id: "desk-organizer", name: "Wooden Desk Organizer Set", category: "Office Supplies", subcategory: "Office Files", brand: "Deli", price: 250, unit: "per set", image: "1152a238316128944b36755a0433a299b6ebce17b0394eb155ada99b76014a28", description: "Multi-compartment desk caddy with pen holders and drawer." },
  { id: "casio-scientific", name: "Casio fx-991CW Scientific Calculator", category: "Office Supplies", subcategory: "Calculators", brand: "Casio", price: 1150, unit: "per piece", image: "1c9b69dee83481a8869d0431c2d3e86be8e112d268e1c47897f3e285db217142", description: "Exam-approved ClassWiz scientific calculator, 540+ functions." },
  { id: "usb-pendrive", name: "USB Pen Drive 32GB", category: "Daily Needs", subcategory: "USB Drives", brand: "", price: 350, unit: "per piece", image: "19d74e331bebc1b910fa45c0926282bde9e7eb51d6eb31928b7a8b08ea905154", description: "Fast plug-and-play 32GB flash drive — perfect for print jobs." },
  { id: "phone-charger", name: "Mobile Charger Adapter 20W", category: "Daily Needs", subcategory: "Mobile Accessories", brand: "", price: 250, unit: "per piece", image: "9dca5be5718ff19ee082cfb2b94ca886c7b0ac58d825723d5b4a5f529b9c23e3", description: "Compact 20W USB-C power adapter, safe and certified." },
  { id: "return-gift-pack", name: "Birthday Return Gift Pack", category: "Gift Shop", subcategory: "Return Gifts", brand: "", price: 199, unit: "per pack", image: "2571a4000bd4f4e9877b7d64888631339aa64c6df38dbc30fcc68da1a29e5e73", description: "Ready-to-give return gift bundle kids love." },
  { id: "paneer-block", name: "Fresh Paneer 200g", category: "Milk & Dairy", subcategory: "Paneer", brand: "Heritage", price: 90, unit: "per pack", image: "9bb6926778b5133fa270d934a8b48c539b84618fee49cab819f5d66d21b56a7f", description: "Soft malai paneer, vacuum packed for freshness." },
  { id: "cheese-slices", name: "Cheese Slices (10 Slices)", category: "Milk & Dairy", subcategory: "Cheese", brand: "Amul", price: 140, unit: "per pack", image: "c1d50253134ddbd76be662e2a00063378a551df556e705f9da710daffded5c16", description: "Processed cheese slices for sandwiches and burgers." },
  { id: "chocolate-flavoured-milk", name: "Chocolate Flavoured Milk 200ml", category: "Milk & Dairy", subcategory: "Flavoured Milk", brand: "", price: 30, unit: "per bottle", image: "2b2896f7e517aba4f70b82aebec65e9ee8a5975fd679f7a90d25f918de066be9", description: "Chilled chocolate flavoured milk in a handy 200ml bottle." },
  { id: "energy-drink-can", name: "Energy Drink Can 250ml", category: "Daily Needs", subcategory: "Energy Drinks", brand: "", price: 110, unit: "per can", image: "93c38a0f2dbe1c0dfb3ce55bd33423ce73769e00ee2a6375e64f06eea3c38e0c", description: "Chilled energy drink can for an on-the-go refreshment." },
];

export const HOME_PRODUCT_FALLBACKS: Record<"best" | "new", Product[]> = {
  best: BEST_SELLERS.map((item) => product(item, "best")),
  new: NEW_ARRIVALS.map((item) => product(item, "new")),
};
