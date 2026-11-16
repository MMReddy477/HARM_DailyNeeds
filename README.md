# H.A.R DAILY NEEDS

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

- Public catalog: 253 deduplicated product/service entries, local representative WebP photos, partial-name/page-count search and pagination.
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

Two QR cards are available: website review submission and Google Maps.

The website-review QR selects its origin in this order:

1. `NEXT_PUBLIC_SITE_URL`, when configured for a public/custom domain.
2. Render's automatic `RENDER_EXTERNAL_URL`.
3. The incoming request origin, with a local LAN address for localhost previews.

The Maps QR searches for the shop's name and address. To open Google's review form directly, configure `NEXT_PUBLIC_GOOGLE_REVIEW_URL` with the real Google Business Ask for reviews link and rebuild. A generated QR cannot create a Google Business listing.

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
