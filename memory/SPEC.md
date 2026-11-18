# H.A.R.M DAILY NEEDS — v2.0 Spec

Retail website for a neighbourhood superstore in Bandlaguda Jagir, Hyderabad: stationery, note books,
office supplies, print & xerox, gift shop, money transfer (info only, in-store counter) and daily needs.
Branding is FIXED: name "H.A.R.M DAILY NEEDS", tagline "Trusted by Families, Students & Offices Since Day One",
royal purple (#581C87 / #3B0764) + gold theme. Phone/WhatsApp: +91 8374778183.

## Stack
FastAPI + Mongo (motor) backend under /api; Vite + React 19 + TS + Tailwind v4 + shadcn frontend.

## Routes (frontend)
- `/` Home: hero, brand strip, 9 service cards, Best Sellers + New Arrivals rails, Print & Xerox rate cards +
  calculator, trust section, reviews (top 3) + review form, Google Map + Open Daily badge, floating quick contact
  (call / WhatsApp / directions / share) bottom-left, AI assistant launcher bottom-right.
- `/c/:slug` category pages — slugs: stationery, notebooks, office-supplies, daily-needs, gifts. `?sub=` filters
  subcategory. Brand filter + search.
- `/print-xerox`, `/location`, `/reviews`
- `/admin/login` (owner only, linked by lock icon in nav + "Owner Login" in footer), `/admin` dashboard.

## Data model (Mongo collections)
- products: id, name, category (Stationery | Note Books | Office Supplies | Daily Needs | Gift Shop), subcategory,
  brand, price, unit, image, description, stock, is_best_seller, is_new, available, created_at, updated_at
- reviews: id, name, rating 1-5, comment, created_at
- transactions: id, type (sale | xerox-bw | xerox-color | print | scan | lamination | binding | photo-print |
  money-transfer), amount, quantity, description, product_id, product_name, category, recorded_date (IST), created_at.
  type=sale with product_id decrements product stock (400 if insufficient).
- users (owner), sessions (httpOnly cookie `harm_session`, 7 days), ai_chats (assistant history)

## API
Public: GET /api/products (category, subcategory, brand, q, flag=best|new), GET /api/products/{id},
GET/POST /api/reviews, POST /api/ai/ask (SSE stream: data:{delta} ... data:{done,reply}).
Owner (cookie): POST/PATCH/DELETE /api/products, DELETE /api/reviews/{id}, POST/GET /api/revenue,
GET /api/revenue/summary (analytics), GET /api/export/excel, GET /api/export/pdf, POST /api/ai/describe,
POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me.

## AI (Emergent LLM key, OpenAI gpt-5.4)
- Storefront "Ask H.A.R.M" assistant — grounded on store facts + live product list, streamed.
- Admin "Write with AI" button in product form — generates a one-line description.

## Seed (cd /app/backend && python seed.py — idempotent)
45 products (8 Note Books, 13 Stationery, 10 Office Supplies, 10 Daily Needs, 4 Gift Shop), 6 reviews
(avg ≈ 4.7), 22 revenue entries over the last 7 days, owner account. Low stock (≤5): Casio fx-991CW (5),
Wooden Desk Organizer Set (6 — not low), etc.

## Integrations status (updated)
- Nightly 11 PM IST closing report: Emergent managed email (EMERGENT_EMAIL_KEY + EMAIL_FROM_NAME in backend/.env). Verified sending. Recipient = Settings > report_email (owner sets it; blank = skipped).
- Print-ready WhatsApp: one-tap wa.me link with pre-typed message (default). Auto-send via Twilio only if TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM are added later.

## v2.2 features
- Festival banners: `banners` collection, fixed ids `diwali` / `rakhi` / `ganesh` / `christmas` / `newyear` (auto-seeded, hidden by default). Public GET /api/banners (enabled only) renders under the homepage hero, linking to /c/gifts. Owner: GET/PUT /api/admin/banners/{id} (title, subtitle, cta_label, enabled) — admin section "Festival Banners".
- Loyalty points: 1 point per full ₹100 of bill total, awarded in POST /api/bills when customer_phone is a valid Indian number. `customers` collection keyed by normalized phone (91XXXXXXXXXX): name, points, total_spent, visits, last_visit. Points are display-only (not redeemable). Bill has points_earned / points_balance. POS shows lookup (GET /api/customers/lookup?phone=); admin "Loyalty Customers" lists GET /api/customers.
- Morning dairy reorder email: cron `morning-stock` 7:00 AM IST -> POST /api/cron/morning-stock (bearer WEBHOOK_CRON_SECRET). Lists Milk & Dairy + Daily Needs beverages (Soft Drinks/Water Bottles/Juices/Energy Drinks) with stock <= reorder_level, emailed to Settings report_email. Skipped when nothing is low or no email set. Manual: POST /api/reports/morning-stock/run (Reports page button).

## v2.3 banner upgrades
- Each banner has product_ids (pre-filled from catalog by name keywords on first seed; owner edits via checklist) and its own public page /festival/{id} (GET /api/banners/{id} -> {banner, products}; 404 unless live).
- Schedule: optional start_date/end_date (YYYY-MM-DD, IST). Computed status: off (enabled=false) | scheduled (today < start) | live | ended (today > end). Only live banners show on homepage. end < start -> 422.

## v2.4 storefront/admin changes
- Homepage: removed Print & Xerox rate section, "Why H.A.R.M" trust cards and Map/Location section (the /print-xerox and /location pages still exist). Added "Milk, Dairy & Cool Drinks" rail (5 dairy + 3 drinks).
- New public page /dairy-drinks (nav "Dairy & Drinks"), tabs Everything / Milk & Dairy / Cool Drinks. API GET /api/products/dairy-drinks (Milk & Dairy + Daily Needs subs Soft Drinks/Water Bottles/Juices/Energy Drinks), declared before /products/{id}.
- Seeded 6 products: Chocolate Flavoured Milk, Cold Coffee, Sweet Lassi, Spiced Buttermilk (Milk & Dairy), Mango Fruit Drink (Juices), Energy Drink (Energy Drinks).
- Admin section "Rate Calculator" (/admin/rate-calculator): multi-line estimate from Settings rates (owner-only).

## v2.5 milk subscriptions, estimate-to-bill, admin drinks
- Public /milk-subscription (CTA on /dairy-drinks hero + homepage dairy rail): choose milk (GET /api/milk/products = Milk & Dairy/Milk), packets/day 1-10, start date >= tomorrow IST, pickup or delivery (address required), name + phone. POST /api/milk/subscriptions (409 on duplicate phone+product, 422 validation). Pay at counter.
- Owner /admin/milk-subs: tomorrow's list (GET /api/admin/milk/tomorrow: totals by product, deliveries sorted by address, pickups), subscriptions with this-month packets, balance due (milk_days charged - milk_payments), pause/resume/cancel (PATCH), record payment (POST .../payments).
- Cron milk-list 9 PM IST -> /api/cron/milk-list: snapshots tomorrow into milk_days (replaces that date) and emails the list to report_email. Manual: POST /api/admin/milk/tomorrow/send.
- Added milk products: Full Cream Milk 500ml (₹34), Double Toned Milk 500ml (₹25).
- Rate Calculator "Create Bill from Estimate" -> navigates to /admin/pos with router state {lines} prefilled as service lines.
- Admin "Milk, Dairy & Drinks" section = Milk & Dairy + Daily Needs beverage subs (ProductsSection `match` prop).

## v2.6 milk extras + xerox price
- Delivery subs store building / floor / flat (+ optional landmark `address`); delivery requires building + flat.
- MilkList adds `skipped` and `order_plan` (per milk: booked + round(avg daily counter sales last 7 days) - stock = to_order). Shown in admin + 9 PM email.
- Printable route sheet (admin button) groups deliveries by building -> floor with tick boxes.
- Statement: GET /api/admin/milk/subscriptions/{id}/statement?month=YYYY-MM; admin "Statement" opens wa.me with month packets/amount/paid/balance + skip link.
- Skip a Day: public /milk-skip (code + phone). POST /api/milk/lookup, POST /api/milk/skip {code, phone, date, skip}. skip_dates on subscription. Tomorrow skippable until 9 PM IST or until owner's manual lock (milk_locks). Owner: POST /api/admin/milk/subscriptions/{id}/skip (adjusts milk_days if the date is already locked).
- B&W Xerox public price: ₹2/page, ₹2.5 both sides (hero chip, rate cards, AI). New service rate `xerox-bw-2side` = ₹2.5 in Settings/POS/Rate Calculator. `inr()` now shows paise (e.g. ₹2.5).
