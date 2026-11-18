"""Seed H.A.R.M DAILY NEEDS with the product catalog, reviews, revenue history and the owner
account. Idempotent — safe to re-run. Run: cd /app/backend && python seed.py"""
import asyncio
import os
import uuid
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from lib.db import client, db, ensure_indexes
from lib.security import hash_password

IST = ZoneInfo("Asia/Kolkata")
IMG = "https://static.prod-images.emergentagent.com/jobs/a22da722-1531-450f-80dd-4e90a44395d3/images/{h}.jpeg"

OWNER_USERNAME = os.environ.get("HARM_ADMIN_USERNAME", "").strip()
OWNER_PASSWORD = os.environ.get("HARM_ADMIN_PASSWORD", "")

# (slug, name, category, subcategory, brand, price, unit, image-hash, description, stock, best, new)
PRODUCTS: list[tuple] = [
    # --- Note Books ---
    ("classmate-long-book", "Classmate Long Book 172 Pages", "Note Books", "Long Books", "Classmate", 60, "per piece", "76b1c69ce704b01ac539d97c5101bca57c356c99c2a4ef9bb29e512deda8b5e9", "Soft-cover long notebook with premium 70 GSM ruled paper.", 40, True, False),
    ("classmate-king-size", "Classmate King Size Book 230 Pages", "Note Books", "Long Books", "Classmate", 90, "per piece", "658a7a3ef42954bcaa8628b6bff736c33251aeee81df5c4d314e60b0de9621ca", "Extra-large king size notebook for detailed notes and projects.", 25, True, False),
    ("navneet-long-book", "Navneet Long Notebook 200 Pages", "Note Books", "Long Books", "Navneet", 65, "per piece", "2f58c4c8e63e4fd29c5ccac708c977e801c84ba371e37346be74a01a84b79b55", "Classic Navneet long book, strong binding and clean ruling.", 30, False, True),
    ("classmate-single-ruled", "Classmate School Notes Single Rule 172 Pgs", "Note Books", "School Notes", "Classmate", 55, "per piece", "f1c5f100e63f7497e12188e386db3ae2f883e5dad58a9c245c18d62514d74d46", "Single rule school notes book, the everyday classroom essential.", 50, True, False),
    ("practical-record", "Science Practical Record Book", "Note Books", "Records", "Sundaram", 70, "per piece", "09e2aa9ce70afa4a2511dd450dd9bee3569eb7af6692a37a82a289cf4609fe17", "Lab practical record with printed sections for experiments.", 20, False, False),
    ("graph-book", "Graph Book Mathematics", "Note Books", "Graph Books", "Classmate", 40, "per piece", "1d3083c410761bd39a7be038c727a4c1226868f30600d1593aeb8ef7890e5b6c", "Fine grid graph book for math and engineering plotting.", 35, False, False),
    ("drawing-book-a3", "Classmate Drawing Book A3", "Note Books", "Drawing Books", "Classmate", 80, "per piece", "d5893ed6bc47b20515f12b4bca47587bb63b429f42ac82e394702cd055d654ad", "Large A3 drawing book with smooth thick white sheets.", 28, True, False),
    ("spiral-notebook", "Spiral Bound Notebook A5", "Note Books", "Spiral Binding", "Sundaram", 45, "per piece", "8ce361b76207da486d6a291eceabaebc0243578161e8aa6c61f6c60f136faacd", "Sturdy A5 spiral notebook that lays flat while writing.", 45, False, True),
    # --- Stationery ---
    ("cello-ball-pens", "Cello Ball Pen Pack (Blue, 10 Pcs)", "Stationery", "Pens & Writing", "Cello", 50, "per pack", "54e2e3fe9cbd5354e4a70d8e511aef7c85024fd08f926b1fdd428990144860de", "Smooth-flow blue ball pens in a value pack of ten.", 60, True, False),
    ("reynolds-pen", "Reynolds 045 Trimax Pen (Pack of 5)", "Stationery", "Pens & Writing", "Reynolds", 35, "per pack", "a42ca8c709db46bf7d5b4a9a5b37d5d1e91a6876986c80ea14f109364e0a5bfe", "The classic 0.45mm fine-trimax writing pen every exam needs.", 55, True, False),
    ("apsara-pencils", "Apsara Drawing Pencils (12 Pcs)", "Stationery", "Pens & Writing", "Apsara", 40, "per pack", "523c7fdcfe772ddf33791c104b3d5f7adeed0140be68f9d747d8e6f5290ab742", "Dark, smudge-free hexagonal graphite pencils for school art.", 48, False, False),
    ("nataraj-pencils", "Nataraj 621 Pencils (Pack of 10)", "Stationery", "Pens & Writing", "Nataraj", 40, "per pack", "21cb5a0e8fdf2eaf7e2bead015c957ebdcca05e4648785837fc20c7eafd42e7b", "India's most trusted pencil — strong bonded lead, pack of 10.", 52, True, False),
    ("camlin-geometry-box", "Camlin Geometry Instrument Box", "Stationery", "Geometry", "Camlin", 110, "per box", "c8004222bb52a12ee6dc9ffa43371c83e83fbe4b113ced8d17f62f05fcdfad5e", "Complete metal geometry set: compass, divider, set squares, protractor.", 18, False, True),
    ("doms-geometry-box", "DOMS Mathematical Instruments Box", "Stationery", "Geometry", "DOMS", 120, "per box", "04dc076e715fb3dbf33d3649dee58bc35ae11e950664dbb9f421c93f7b624447", "Precision math instruments in a sturdy hard case.", 15, False, False),
    ("faber-oil-pastels", "Faber-Castell Oil Pastels (25 Shades)", "Stationery", "Art & Craft", "Faber-Castell", 95, "per set", "9f8bf891cc0659597b7ae2507d47503cf6088646e09766a524d49aed46f8e1b4", "Rich, blendable oil pastels in 25 vibrant shades.", 22, True, False),
    ("camlin-crayons", "Camlin Wax Crayons (24 Shades)", "Stationery", "Art & Craft", "Camlin", 60, "per set", "c2096f8c59343a34fce94bcd8731bf280cae13ad75f0625402a10eef9e053676", "Bright non-toxic wax crayons for young artists.", 26, False, False),
    ("kangaro-stapler", "Kangaro HD-10 Stapler", "Stationery", "Office Accessories", "Kangaro", 150, "per piece", "65472fd020282b7b78776f86c4316d5942ae10a8463a77683c7765d62f2614d7", "Heavy-duty metal stapler with a full strip of pins included.", 12, False, False),
    ("a4-paper-ream", "JK Copier A4 Paper (500 Sheets)", "Stationery", "Papers & Labels", "JK Paper", 280, "per ream", "dd437fa517b49977a0ef66c8e774e0fb47cb62fa5be2793690a841b8f35c4d6e", "75 GSM jam-free A4 copier paper, one full ream.", 30, True, False),
    ("sticky-notes", "3M Post-it Sticky Notes", "Stationery", "Office Accessories", "3M Post-it", 55, "per pad", "e76154ded4a6f22c991fa181ab481f1e2312d5277cd411f6177fe16e40c39db3", "Original re-adherable sticky notes in assorted colours.", 20, False, True),
    ("highlighters", "Faber-Castell Highlighter Set (4 Pcs)", "Stationery", "Pens & Writing", "Faber-Castell", 120, "per set", "2ead95d82ede9c3bdbc7c45080adf93743b5e36f7f5d19304f97b87fbfc9f0b7", "Chisel-tip fluorescent highlighters for smart study.", 18, False, True),
    ("solo-display-file", "Solo Display File A4 (20 Pockets)", "Stationery", "Files & Folders", "Solo", 90, "per piece", "0be37863610cf9bd2b8776bb9fb100c72cf2d24cfa5d86a33cebb3e2a5f49e8c", "Clear punched-pocket display file for certificates and documents.", 24, False, False),
    # --- Office Supplies ---
    ("attendance-register", "Staff Attendance Register", "Office Supplies", "Registers", "Standard", 120, "per piece", "a6dfe5a12856d07bdc6dc8005a6bcb164437ada1565271f6fa3d0bfc7d011123", "Hardbound month-wise attendance register for offices and shops.", 14, True, False),
    ("ledger-book", "Ledger Book 200 Pages", "Office Supplies", "Ledgers", "Eagle", 150, "per piece", "6303a6993f7a6f7cb95e590dc3e40d20e5957c2f3a1a939f625d3b296f7eb312", "Section-ruled ledger with premium hard binding.", 10, False, False),
    ("cash-book", "Cash Book Double Column", "Office Supplies", "Cash Books", "Eagle", 160, "per piece", "bad49e0517d96a7a59040f7475cdab67f3dd502697fd874a7c7c0025888f30b3", "Double-column cash book for receipts and payments.", 8, False, False),
    ("invoice-book", "Tax Invoice Book (Duplicate)", "Office Supplies", "Invoice Books", "Falcon", 140, "per book", "4f0a6537c6e4f69a519f06266d1cdd98246ee8a494c2a84fee0b0417ddea9346", "Carbonless duplicate tax invoice book, 50 sets.", 12, False, False),
    ("receipt-book", "Money Receipt Book", "Office Supplies", "Invoice Books", "Falcon", 90, "per book", "a0b9c4e45035bfd81458baa517f40d149a25efbb83fdaabc893a40ffbf60ca73", "Numbered carbonless money receipt book with counterfoil.", 16, False, False),
    ("box-file", "Box File Lever Arch", "Office Supplies", "Office Files", "Solo", 110, "per piece", "eb02c7072e426593dfb3bb8a7846be3508d922f90ce40432455d4f87cd0244a0", "Foolscap box file with lever arch clamp and index tab.", 9, False, False),
    ("ring-file", "Ring Binder File", "Office Supplies", "Office Files", "Solo", 85, "per piece", "0f83e6b81335111801c0ca73f9e655344f3f1f7364fed7e8ffa3b1e61eb5d39d", "Two-ring binder for punched documents, holds 150+ sheets.", 11, False, False),
    ("desk-organizer", "Wooden Desk Organizer Set", "Office Supplies", "Office Files", "Deli", 250, "per set", "1152a238316128944b36755a0433a299b6ebce17b0394eb155ada99b76014a28", "Multi-compartment desk caddy with pen holders and drawer.", 6, False, True),
    ("casio-calculator", "Casio MJ-12D Desktop Calculator", "Office Supplies", "Calculators", "Casio", 575, "per piece", "5842b2cdb82b96fb0fa2abb2abb0fe26e9aa806568bc3d19aa2b4082286d679d", "12-digit desktop calculator with tax and profit keys.", 7, True, False),
    ("casio-scientific", "Casio fx-991CW Scientific Calculator", "Office Supplies", "Calculators", "Casio", 1150, "per piece", "1c9b69dee83481a8869d0431c2d3e86be8e112d268e1c47897f3e285db217142", "Exam-approved ClassWiz scientific calculator, 540+ functions.", 5, False, True),
    # --- Daily Needs ---
    ("chocolate-pack", "Premium Milk Chocolate Bar", "Daily Needs", "Chocolates", "", 80, "per bar", "590061e926e7df213f33815f681e87cbab7aae0271640007c1afdcbb95b42229", "Smooth, rich milk chocolate bar — a bestseller at the counter.", 40, True, False),
    ("biscuit-pack", "Glucose Biscuit Family Pack", "Daily Needs", "Biscuits", "", 35, "per pack", "3cd0394d57696f6bb50e29b173b2c241d5efad4012c68ee878aa2ec10669be77", "Crispy glucose biscuits, family size pack.", 60, True, False),
    ("snack-pack", "Party Snack Chips Pack", "Daily Needs", "Snacks", "", 20, "per pack", "6d6e87a6b380a50db1e68295b68fe6dd8f6f135c9ac94decab416fc5903eda66", "Crunchy masala chips in a fun foil pack.", 80, False, False),
    ("cold-drink", "Chilled Soft Drink 750ml", "Daily Needs", "Soft Drinks", "", 40, "per bottle", "693bce7369a06dfe3d9b2ef0000972b5ea421639c44f5d1ec01ce6f420c4a1e8", "Ice-cold fizzy drink, always chilled in the fridge.", 35, False, False),
    ("mineral-water", "Mineral Water Bottle 1L", "Daily Needs", "Water Bottles", "", 20, "per bottle", "0ca141d3c76e17aa54d0dd29de5cbcab0ee73b4f3c8705a9c6d3bd7014b97485", "Sealed 1-litre mineral water, purified and safe.", 90, False, False),
    ("aa-batteries", "AA Batteries (Pack of 4)", "Daily Needs", "Batteries", "", 60, "per pack", "fcfdd276b89d239212bcfc301fdfc54a6cd2502f4870a7f31f0d4abe23914969", "Long-lasting alkaline AA cells for remotes and toys.", 25, False, False),
    ("usb-pendrive", "USB Pen Drive 32GB", "Daily Needs", "USB Drives", "", 350, "per piece", "19d74e331bebc1b910fa45c0926282bde9e7eb51d6eb31928b7a8b08ea905154", "Fast plug-and-play 32GB flash drive — perfect for print jobs.", 10, False, True),
    ("wired-earphones", "Wired Earphones with Mic", "Daily Needs", "Earphones", "", 150, "per piece", "4abcfe65e4b88f0c25437277a8e727344cce2fdad226b908b768dea01edb015d", "Clear-sound in-ear earphones with an inline microphone.", 15, True, False),
    ("charging-cable", "Fast Charging Cable Type-C", "Daily Needs", "Mobile Accessories", "", 120, "per piece", "aa2df11c3480cc34065c4de4ae48724f0ed3afa898b5b958792cbd0ce095bbfd", "Braided 60W fast-charge Type-C cable, tangle free.", 20, False, False),
    ("phone-charger", "Mobile Charger Adapter 20W", "Daily Needs", "Mobile Accessories", "", 250, "per piece", "9dca5be5718ff19ee082cfb2b94ca886c7b0ac58d825723d5b4a5f529b9c23e3", "Compact 20W USB-C power adapter, safe and certified.", 8, False, True),
    # --- Gift Shop ---
    ("pen-gift-set", "Premium Pen Gift Set", "Gift Shop", "Gift Sets", "", 299, "per set", "45de0954baa8528aa8d277af9273b11e9251812bb785a8263a67b2dc09dce7fd", "Twin metallic pens in a satin-lined presentation box.", 9, True, False),
    ("return-gift-pack", "Birthday Return Gift Pack", "Gift Shop", "Return Gifts", "", 199, "per pack", "2571a4000bd4f4e9877b7d64888631339aa64c6df38dbc30fcc68da1a29e5e73", "Ready-to-give return gift bundle kids love.", 12, False, True),
    ("greeting-cards", "Greeting Cards Assorted (Set of 3)", "Gift Shop", "Cards & Wraps", "", 49, "per set", "c7e98b234265f0cdb5d6f51ee2a3f78725bf0562662ff0c8d42be152373c79fa", "Hand-finished floral greeting cards for every occasion.", 18, False, False),
    ("art-gift-kit", "Art & Craft Gift Kit", "Gift Shop", "Creative Kits", "", 349, "per kit", "54f67b8289f419b87149dee98b3f041bc6a84f904a9038c0ed6f79b15a50a73e", "Complete creative kit: sketchpad, pencils, brushes and more.", 7, True, False),
    # --- Milk & Dairy ---
    ("milk-packet", "Toned Milk Packet 500ml", "Milk & Dairy", "Milk", "Vijaya", 28, "per packet", "449dfd520e511cc3176cfb3170112ce93184b3e92aac72dfeaf59e1cf60299fc", "Fresh pasteurised toned milk, delivered every morning.", 3, True, False),
    ("curd-cup", "Fresh Curd Cup 400g", "Milk & Dairy", "Curd", "Heritage", 35, "per cup", "52e30de41168f18fedf3e06fe9ab7eea75abeba6197f50d89ba2e28de79cc820", "Thick, creamy set curd made from toned milk.", 14, False, False),
    ("paneer-block", "Fresh Paneer 200g", "Milk & Dairy", "Paneer", "Heritage", 90, "per pack", "9bb6926778b5133fa270d934a8b48c539b84618fee49cab819f5d66d21b56a7f", "Soft malai paneer, vacuum packed for freshness.", 8, False, True),
    ("butter-pack", "Salted Butter 100g", "Milk & Dairy", "Butter", "Amul", 58, "per pack", "4d090eb7c7d9dfc8cf1a155dfed1fca8eae15280d422899973081d675d65ada6", "Classic salted table butter.", 12, False, False),
    ("cheese-slices", "Cheese Slices (10 Slices)", "Milk & Dairy", "Cheese", "Amul", 140, "per pack", "c1d50253134ddbd76be662e2a00063378a551df556e705f9da710daffded5c16", "Processed cheese slices for sandwiches and burgers.", 6, False, True),
    ("spiced-buttermilk", "Spiced Buttermilk 500ml", "Milk & Dairy", "Buttermilk", "", 20, "per pouch", "5f433c675144bcd1a1609e8d9dda86af2fce5b717924a6fd9e0a79b8fd75d9d9", "Chilled, lightly spiced buttermilk for a refreshing everyday drink.", 24, True, False),
    ("chocolate-flavoured-milk", "Chocolate Flavoured Milk 200ml", "Milk & Dairy", "Flavoured Milk", "", 30, "per bottle", "2b2896f7e517aba4f70b82aebec65e9ee8a5975fd679f7a90d25f918de066be9", "Chilled chocolate flavoured milk in a handy 200ml bottle.", 18, False, True),
    ("cold-coffee", "Cold Coffee Bottle 200ml", "Milk & Dairy", "Flavoured Milk", "", 45, "per bottle", "3f8ff3aacaa31eebc72d29a0fb5d5628e9908202fc916af80328a2e8c22ca359", "Ready-to-drink chilled coffee in a convenient 200ml bottle.", 16, False, False),
    ("energy-drink-can", "Energy Drink Can 250ml", "Daily Needs", "Energy Drinks", "", 110, "per can", "93c38a0f2dbe1c0dfb3ce55bd33423ce73769e00ee2a6375e64f06eea3c38e0c", "Chilled energy drink can for an on-the-go refreshment.", 20, False, True),
    ("mango-fruit-drink", "Mango Fruit Drink 1L", "Daily Needs", "Juices", "", 99, "per pack", "ac851b7c54a71080c795961c725b2ac332e9837c20a0a446378a19fb55662659", "Refreshing one-litre mango fruit drink, served chilled.", 18, False, False),
]

DAIRY_EXPIRY_DAYS = {
    "milk-packet": 1,
    "curd-cup": 3,
    "paneer-block": 4,
    "butter-pack": 60,
    "cheese-slices": 45,
    "spiced-buttermilk": 3,
    "chocolate-flavoured-milk": 10,
    "cold-coffee": 7,
}

# Back-to-school kits: (sort, name, class_range, description, [(slug, qty)])
KITS = [
    (1, "Primary Starter Kit", "Class 1 - 5", "Everything little learners need on day one.", [("classmate-single-ruled", 4), ("nataraj-pencils", 1), ("camlin-crayons", 1), ("drawing-book-a3", 1)]),
    (2, "Middle School Kit", "Class 6 - 8", "Notebooks, geometry and pens for growing subjects.", [("classmate-long-book", 6), ("camlin-geometry-box", 1), ("cello-ball-pens", 1), ("graph-book", 1), ("apsara-pencils", 1)]),
    (3, "High School Kit", "Class 9 - 10", "Board-exam ready: records, scientific calculator and highlighters.", [("classmate-king-size", 6), ("practical-record", 2), ("reynolds-pen", 1), ("highlighters", 1), ("casio-scientific", 1)]),
]


def slug_id(slug: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"harm-product-{slug}"))


REVIEWS: list[dict] = [
    {"name": "Srilatha Reddy", "rating": 5, "comment": "Best stationery shop in Bandlaguda Jagir! Got all my daughter's school books - Classmate, Navneet, everything under one roof at reasonable prices.", "days_ago": 2},
    {"name": "Mohammed Abdul", "rating": 5, "comment": "Very convenient. Xerox and spiral binding done in minutes. The owner is polite and helpful.", "days_ago": 5},
    {"name": "Kavitha S", "rating": 5, "comment": "Bought geometry boxes, pens and art supplies for my kids. Good quality products and affordable prices.", "days_ago": 8},
    {"name": "Rahul Verma", "rating": 4, "comment": "Great collection of office registers and files. They also help with money transfer. Open till 10 PM which is very handy.", "days_ago": 11},
    {"name": "Anusha P", "rating": 5, "comment": "One stop solution - from notebooks to chocolates to USB drives. Saved me a trip to the supermarket.", "days_ago": 15},
    {"name": "Imran Khan", "rating": 4, "comment": "Fast xerox service and good printing rates. Highly recommended for students around Suryodhaya Colony.", "days_ago": 20},
]

# (offset_days_ago, type, description, quantity, amount, product_slug)
REVENUE: list[tuple] = [
    (0, "xerox-bw", "B&W copies - 45 pages", 45, 45, ""),
    (0, "xerox-color", "Color Xerox - 8 pages", 8, 40, ""),
    (0, "print", "A4 printouts - 25 pages", 25, 50, ""),
    (0, "sale", "Counter sale", 2, 120, "classmate-long-book"),
    (0, "money-transfer", "Domestic transfer Rs.4,500 - commission", 1, 35, ""),
    (0, "sale", "Counter sale", 1, 50, "cello-ball-pens"),
    (1, "binding", "3 spiral bindings", 3, 120, ""),
    (1, "lamination", "5 A4 laminations", 5, 100, ""),
    (1, "sale", "Counter sale", 1, 575, "casio-calculator"),
    (1, "scan", "2 documents scanned", 2, 20, ""),
    (2, "xerox-bw", "B&W copies - 60 pages", 60, 60, ""),
    (2, "sale", "Counter sale", 2, 100, "reynolds-pen"),
    (2, "photo-print", "2 passport photo sets", 2, 40, ""),
    (3, "print", "A4 printouts - 15 pages", 15, 30, ""),
    (3, "sale", "Counter sale", 1, 95, "faber-oil-pastels"),
    (3, "money-transfer", "Domestic transfer Rs.6,000 - commission", 1, 50, ""),
    (4, "xerox-bw", "B&W copies - 35 pages", 35, 35, ""),
    (4, "lamination", "3 certificate laminations", 3, 60, ""),
    (5, "sale", "Counter sale", 2, 160, "drawing-book-a3"),
    (5, "xerox-color", "Color Xerox - 5 pages", 5, 25, ""),
    (6, "binding", "2 spiral bindings", 2, 80, ""),
    (6, "scan", "1 document scanned", 1, 10, ""),
]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def seed() -> None:
    if not OWNER_USERNAME or not OWNER_PASSWORD:
        raise RuntimeError("Set HARM_ADMIN_USERNAME and HARM_ADMIN_PASSWORD before seeding.")

    # Owner account (upsert by username)
    await db.users.update_one(
        {"username": OWNER_USERNAME},
        {
            "$set": {"password_hash": hash_password(OWNER_PASSWORD), "role": "owner"},
            "$setOnInsert": {"id": str(uuid.uuid4())},
        },
        upsert=True,
    )

    # Products (replace by deterministic id)
    now = utcnow()
    for i, (slug, name, category, sub, brand, price, unit, img, desc, stock, best, new) in enumerate(PRODUCTS):
        existing = await db.products.find_one({"id": slug_id(slug)})
        if existing:
            # never clobber owner edits (stock, price, photos) on re-seed — only backfill new fields
            backfill = {k: v for k, v in {"cost_price": round(price * 0.72, 2), "reorder_level": 5, "expiry_date": ""}.items() if k not in existing}
            if backfill:
                await db.products.update_one({"id": existing["id"]}, {"$set": backfill})
            continue
        expiry = ""
        if slug in DAIRY_EXPIRY_DAYS:
            expiry = (datetime.now(IST) + timedelta(days=DAIRY_EXPIRY_DAYS[slug])).strftime("%Y-%m-%d")
        doc = {
            "id": slug_id(slug),
            "name": name,
            "category": category,
            "subcategory": sub,
            "brand": brand,
            "price": price,
            "cost_price": round(price * (0.85 if category == "Milk & Dairy" else 0.72), 2),
            "reorder_level": 5,
            "expiry_date": expiry,
            "unit": unit,
            "image": IMG.format(h=img),
            "description": desc,
            "stock": stock,
            "is_best_seller": best,
            "is_new": new,
            "available": stock > 0,
            "created_at": now - timedelta(hours=i * 7),
            "updated_at": now - timedelta(hours=i * 7),
        }
        await db.products.insert_one(doc)

    if await db.kits.count_documents({}) == 0:
        for sort, kname, crange, kdesc, items in KITS:
            await db.kits.insert_one({"id": str(uuid.uuid4()), "name": kname, "class_range": crange, "description": kdesc,
                                      "items": [{"product_id": slug_id(s), "qty": q} for s, q in items], "sort": sort})
    await db.settings.update_one({"id": "store"}, {"$setOnInsert": {"id": "store"}}, upsert=True)
    # backfill cost on seeded sales so profit reports are meaningful
    async for t in db.transactions.find({"type": "sale", "cost": {"$exists": False}}):
        p = await db.products.find_one({"id": t.get("product_id")})
        cost = float(p.get("cost_price", 0)) * t.get("quantity", 1) if p else 0
        await db.transactions.update_one({"_id": t["_id"]}, {"$set": {"cost": cost}})

    # Reviews (only once — never overwrite customer submissions)
    if await db.reviews.count_documents({}) == 0:
        for r in REVIEWS:
            await db.reviews.insert_one(
                {
                    "id": str(uuid.uuid4()),
                    "name": r["name"],
                    "rating": r["rating"],
                    "comment": r["comment"],
                    "created_at": utcnow() - timedelta(days=r["days_ago"]),
                }
            )

    # Revenue history (only once)
    if await db.transactions.count_documents({}) == 0:
        for offset, type_, desc, qty, amount, slug in REVENUE:
            product = await db.products.find_one({"id": slug_id(slug)}) if slug else None
            await db.transactions.insert_one(
                {
                    "id": str(uuid.uuid4()),
                    "type": type_,
                    "amount": amount,
                    "quantity": qty,
                    "description": desc,
                    "product_id": product["id"] if product else "",
                    "product_name": product["name"] if product else "",
                    "category": product["category"] if product else "",
                    "recorded_date": (
                        datetime.now(IST) - timedelta(days=offset)
                    ).strftime("%Y-%m-%d"),
                    "created_at": utcnow() - timedelta(days=offset, hours=2),
                }
            )

    await ensure_indexes()
    print(
        f"Seeded: {len(PRODUCTS)} products, {await db.reviews.count_documents({})} reviews, "
        f"{await db.transactions.count_documents({})} revenue entries; owner account ready."
    )


if __name__ == "__main__":
    asyncio.run(seed())
    client.close()
