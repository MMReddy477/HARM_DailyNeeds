import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";

import QuickContact from "@/components/QuickContact";
import { buttonVariants } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { PLACEHOLDER_IMG, STORE } from "@/lib/constants";
import { inr, type KitView } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRODUCT_IMAGE = "https://static.prod-images.emergentagent.com/jobs/a22da722-1531-450f-80dd-4e90a44395d3/images";
const STARTER_KITS: KitView[] = [
  {
    id: "primary-starter-kit",
    name: "Primary Starter Kit",
    class_range: "Class 1 - 5",
    description: "Everything little learners need on day one.",
    sort: 1,
    total: 400,
    items: [
      { product_id: "classmate-single-ruled", name: "Classmate School Notes Single Rule 172 Pgs", qty: 4, price: 55, image: `${PRODUCT_IMAGE}/f1c5f100e63f7497e12188e386db3ae2f883e5dad58a9c245c18d62514d74d46.jpeg` },
      { product_id: "nataraj-pencils", name: "Nataraj 621 Pencils (Pack of 10)", qty: 1, price: 40, image: `${PRODUCT_IMAGE}/21cb5a0e8fdf2eaf7e2bead015c957ebdcca05e4648785837fc20c7eafd42e7b.jpeg` },
      { product_id: "camlin-crayons", name: "Camlin Wax Crayons (24 Shades)", qty: 1, price: 60, image: `${PRODUCT_IMAGE}/c2096f8c59343a34fce94bcd8731bf280cae13ad75f0625402a10eef9e053676.jpeg` },
      { product_id: "drawing-book-a3", name: "Classmate Drawing Book A3", qty: 1, price: 80, image: `${PRODUCT_IMAGE}/d5893ed6bc47b20515f12b4bca47587bb63b429f42ac82e394702cd055d654ad.jpeg` },
    ],
  },
  {
    id: "middle-school-kit",
    name: "Middle School Kit",
    class_range: "Class 6 - 8",
    description: "Notebooks, geometry and pens for growing subjects.",
    sort: 2,
    total: 600,
    items: [
      { product_id: "classmate-long-book", name: "Classmate Long Book 172 Pages", qty: 6, price: 60, image: `${PRODUCT_IMAGE}/76b1c69ce704b01ac539d97c5101bca57c356c99c2a4ef9bb29e512deda8b5e9.jpeg` },
      { product_id: "camlin-geometry-box", name: "Camlin Geometry Instrument Box", qty: 1, price: 110, image: `${PRODUCT_IMAGE}/c8004222bb52a12ee6dc9ffa43371c83e83fbe4b113ced8d17f62f05fcdfad5e.jpeg` },
      { product_id: "cello-ball-pens", name: "Cello Ball Pen Pack (Blue, 10 Pcs)", qty: 1, price: 50, image: `${PRODUCT_IMAGE}/54e2e3fe9cbd5354e4a70d8e511aef7c85024fd08f926b1fdd428990144860de.jpeg` },
      { product_id: "graph-book", name: "Graph Book Mathematics", qty: 1, price: 40, image: `${PRODUCT_IMAGE}/1d3083c410761bd39a7be038c727a4c1226868f30600d1593aeb8ef7890e5b6c.jpeg` },
      { product_id: "apsara-pencils", name: "Apsara Drawing Pencils (12 Pcs)", qty: 1, price: 40, image: `${PRODUCT_IMAGE}/523c7fdcfe772ddf33791c104b3d5f7adeed0140be68f9d747d8e6f5290ab742.jpeg` },
    ],
  },
  {
    id: "high-school-kit",
    name: "High School Kit",
    class_range: "Class 9 - 10",
    description: "Board-exam ready: records, scientific calculator and highlighters.",
    sort: 3,
    total: 1985,
    items: [
      { product_id: "classmate-king-size", name: "Classmate King Size Book 230 Pages", qty: 6, price: 90, image: `${PRODUCT_IMAGE}/658a7a3ef42954bcaa8628b6bff736c33251aeee81df5c4d314e60b0de9621ca.jpeg` },
      { product_id: "practical-record", name: "Science Practical Record Book", qty: 2, price: 70, image: `${PRODUCT_IMAGE}/09e2aa9ce70afa4a2511dd450dd9bee3569eb7af6692a37a82a289cf4609fe17.jpeg` },
      { product_id: "reynolds-pen", name: "Reynolds 045 Trimax Pen (Pack of 5)", qty: 1, price: 35, image: `${PRODUCT_IMAGE}/a42ca8c709db46bf7d5b4a9a5b37d5d1e91a6876986c80ea14f109364e0a5bfe.jpeg` },
      { product_id: "highlighters", name: "Faber-Castell Highlighter Set (4 Pcs)", qty: 1, price: 120, image: `${PRODUCT_IMAGE}/2ead95d82ede9c3bdbc7c45080adf93743b5e36f7f5d19304f97b87fbfc9f0b7.jpeg` },
      { product_id: "casio-scientific", name: "Casio fx-991CW Scientific Calculator", qty: 1, price: 1150, image: `${PRODUCT_IMAGE}/1c9b69dee83481a8869d0431c2d3e86be8e112d268e1c47897f3e285db217142.jpeg` },
    ],
  },
];

function orderLink(k: KitView) {
  const lines = k.items.map((i) => `- ${i.name} x${i.qty}`).join("\n");
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(`Hi ${STORE.name}! I'd like to order the ${k.name} (${k.class_range}) for ${inr(k.total)}:\n${lines}`)}`;
}

export default function SchoolKitsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["kits"],
    queryFn: () => apiGet<KitView[]>("/kits"),
    initialData: STARTER_KITS,
  });
  const kits = data?.length ? data : STARTER_KITS;
  const showingStarterKits = isError || !data?.length;
  return (
    <>
      <section className="bg-[#3B0764]">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Back to School</p>
          <h1 className="mt-1.5 font-heading text-3xl font-extrabold text-white sm:text-4xl">Ready-Made School Kits</h1>
          <p className="mt-2 max-w-2xl text-purple-200">Pick your class, order on WhatsApp, and collect a packed kit — no list-checking, no running around.</p>
        </div>
      </section>
      {showingStarterKits ? (
        <p className="mx-auto mt-5 max-w-7xl px-4 text-sm text-slate-600" role={isError ? "status" : undefined} data-testid="school-kits-starter-notice">
          Showing starter kit details. Prices and availability may change; please confirm when ordering on WhatsApp.
        </p>
      ) : null}
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? [0, 1, 2].map((i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-purple-50" />) : kits.map((k) => (
          <div key={k.id} className="flex flex-col rounded-2xl border border-purple-100 bg-white p-5 shadow-sm" data-testid={`school-kit-${k.id}`}>
            <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-800">{k.class_range}</span>
            <h2 className="mt-3 font-heading text-xl font-extrabold text-purple-950">{k.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{k.description}</p>
            <ul className="mt-4 flex-1 space-y-2">
              {k.items.map((i) => (
                <li key={i.product_id} className="flex items-center gap-3 text-sm">
                  <img src={i.image || PLACEHOLDER_IMG} alt="" loading="lazy" className="size-10 rounded-lg border object-cover" />
                  <span className="flex-1 text-slate-800">{i.name}</span>
                  <span className="text-slate-500">×{i.qty}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center justify-between border-t pt-4">
              <div><p className="text-xs text-slate-500">Kit total</p><p className="font-heading text-2xl font-extrabold text-purple-900" data-testid={`school-kit-total-${k.id}`}>{inr(k.total)}</p></div>
              <a href={orderLink(k)} target="_blank" rel="noreferrer" className={cn(buttonVariants(), "gap-1.5 bg-emerald-600 hover:bg-emerald-700")} data-testid={`school-kit-order-${k.id}`}><MessageCircle className="size-4" /> Order on WhatsApp</a>
            </div>
          </div>
        ))}
      </section>
      <QuickContact />
    </>
  );
}
