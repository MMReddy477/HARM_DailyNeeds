# H.A.R.M DAILY NEEDS

Stationery, Dairy & Refreshing Drinks Under One Roof

Trusted by Families, Students & Offices Since Day One

A Next.js storefront and private owner dashboard for the Bandlaguda Jagir shop. Public pages include searchable product prices, stationery, notebooks, office supplies, gifts, daily needs, print estimates, customer reviews and contact actions.

## Local setup

Use Node.js 20.9 or newer:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Edit `.env.local` with your MongoDB URI, owner username/password, a random session secret of at least 32 characters, and optional public settings. Never commit this file.

For a production-style local run:

```powershell
npm run build
npm start
```

Open http://localhost:3000. A phone needs the same local network and access to port 3000 while using the local preview. Visitors on mobile data need a deployed public website.

## Products and prices

- Public catalog: 257 deduplicated product/service entries, local representative WebP photos, partial-name/page-count search and pagination.
- Saved inventory prices take priority over catalog starting prices. Amounts marked `(est.)` are draft estimates, not guaranteed brand/pack prices.
- Admin can add/edit products and import public price entries for review. Imported entries begin with zero stock; set actual stock and selling prices before treating them as available.
- Admin > Quick Rate Calculator supports multiple items, quantities, quote-only rate overrides and discounts. It does not change inventory or record a sale.
- Service charges without a confirmed rate require owner input.

## Customer reviews

- `/reviews#write-review` opens the submission form directly.
- Customers submit a name, 1-5 rating, review text and publication consent. Submissions are saved in MongoDB as pending.
- Admin > Customer Reviews approves/rejects feedback. Only approved website reviews are returned by the public API.
- Three existing testimonial cards reproduce shop-supplied feedback. The owner's stated 4.9 rating is separate from new website submissions.
- Website submissions do not post to Google.

## QR destinations

The homepage has one review QR; it opens the shop review form until a Google Business review link is configured. The existing website-review QR endpoint (`/api/review-qr?kind=shop`) remains available for previously printed codes.

The compatible website-review QR selects its origin in this order:

1. `NEXT_PUBLIC_SITE_URL`, when configured for a public/custom domain.
2. Render's automatic `RENDER_EXTERNAL_URL`.
3. The incoming request origin, with a local LAN address for localhost previews.

Configure NEXT_PUBLIC_GOOGLE_REVIEW_URL with the real Google Business review link to switch the buttons and QR to Google. The non-working sample URL is blocked; the default opens /reviews#write-review. A generated QR cannot create a Google Business listing.

## Mobile behavior

Responsive navigation, touch-friendly controls, 16px mobile form inputs, a compact contact dock, safe-area spacing, visible sticky rating/hours and phone-friendly review cards are included. The hours dropdown supports click/tap, hover and keyboard access. Motion effects respect reduced-motion preferences.

## Deployment

`render.yaml` targets the `main` branch with:

- Build: `npm install --include=dev && npm run build`
- Start: `npm start`
- Required private environment variables: `MONGODB_URI`, `HARM_ADMIN_USERNAME`, `HARM_ADMIN_PASSWORD`, `HARM_SESSION_SECRET`.
- Optional: `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOOGLE_REVIEW_URL`.

A Git push may trigger an existing connected Render service. GitHub code hosting alone is not website hosting. Public QR codes should use the final deployed URL.

## Validation

```powershell
npm run check
node scripts/validate-catalog.cjs
node scripts/validate-local.cjs
node scripts/validate-review-flow.cjs
npm run build
```

Local route checks require the server to be running. The review-flow integration check uses configured owner credentials internally, creates one temporary pending test review, tests owner moderation, and removes that test record. It never publishes a synthetic testimonial or prints credentials.

Photo source URLs are recorded in `public/images/**/sources.json`, `additional-sources.json` and `service-sources.json`. Files in the project root belonging to the earlier static prototype are retained; `npm` runs the Next.js app.

The public homepage no longer displays the Print & Xerox rate-card/calculator panel. Admin > Quick Rate Calculator now contains the Print & Stationery Counter, with selectable print and stationery/book rates, quantities, quote-only overrides and saved inventory price precedence. The multi-item calculator remains below it.

The large purple homepage footer has been removed. Contact navigation and contact CTAs now open the shop WhatsApp link; Visit Store CTAs open address-based Google Maps directions, avoiding removed contact anchors.

### Google-first featured reviews
The homepage customer review section now displays exactly three featured reviews (latest approved website feedback first, then the owner-provided fallback copy). Badges say Local Customer as requested; no verified-customer claim or Google-import claim is made. The section has a compact trust row, one Google review QR, a copy-link button with a manual-copy fallback, and a Visit Store CTA. The owner-supplied default review URL is https://g.page/r/CaeQwq8jEcDwEAI/review; in a server-side check this redirected to the Google homepage, so the actual shop review destination still needs owner verification. NEXT_PUBLIC_GOOGLE_REVIEW_URL can override it. The separate website review form and moderation system remain available at /reviews#write-review; the older kind=shop QR endpoint remains compatible.

The example g.page review URL was confirmed to redirect to the Google homepage. It is no longer used as a default or accepted as a configuration value. Without a replacement Google Business review link, both review CTAs, the QR and Copy Review Link use the working website submission form. Labels switch to Shop Review so website feedback is not presented as a Google review.

### Complete neighbourhood-store homepage
The new hero explicitly highlights stationery, fresh milk/dairy, drinks, printing and money transfer. Milk & Dairy and Cool Drinks have dedicated pages and searchable catalog categories; saved inventory rates still override estimates. The six homepage service cards focus on the core offerings while notebooks, office supplies and gifts remain in the full catalog. The requested footer is restored with key department/review/contact links. The gallery uses labeled collection/service previews and a shop-front placeholder until real store photographs are supplied; no stock picture is presented as an actual shop photograph. The owner confirmed that hundreds of customers is accurate; the trust row uses Trusted by Hundreds of Customers. The previously supplied Google review URL is still blocked because it redirects to Google home; the working website review form remains the fallback.

The header now uses a two-level School & Office Supplies menu: hover/focus a left category to show only its related right-hand items; touch uses explicit category controls. Main categories navigate to /category/[slug], and subcategories to /products/[slug]. Existing notebook, office and daily-needs pages remain available in the catalog without separate header links.

Brand tagline: Stationery, Dairy & Refreshing Drinks Under One Roof. Header, footer, login, print branding and mobile navigation use the same H.A.R.M DAILY NEEDS brand.

### Retail branding and catalog update
- Header order: Home, School & Office Supplies, Note Books, Milk & Dairy, Cool Drinks, Print & Xerox, Money Transfer, Contact. Notebook dropdown has ten dedicated collections.
- Custom HM artwork: `public/brand/harm-horizontal.svg` and `.png`, `harm-icon.svg` and `.png`, `favicon-32.png`, `apple-touch-icon.png`. Reuse these for the shop signboard, Business Profile and printed material; no external profile was changed.
- Printing starting prices and representative photographs are shared through `lib/print-services.ts`. Admin-saved amounts override defaults; counter calculators use the same service list. All catalog images are photos; image provenance is saved beside assets.
