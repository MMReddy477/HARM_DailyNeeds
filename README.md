# H.A.R.M Daily Needs

A responsive Next.js 15 storefront and private owner workspace for H.A.R.M Daily Needs at 2-2/30/201 My Abode the Sirius, Suryohayacolony, Bandlaguda Jagir 500086. The public website has service discovery, stationery product highlights without public prices, a WhatsApp call to action, contact details, and responsive navigation. `/owner-login` is the only owner-login link; `/admin` and its data API require a signed, HTTP-only session.

## Run locally

Use Node.js 20.9 or newer. Install dependencies, make a private environment file, and configure the values in `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Set a new owner username and a strong, unique password. The password previously shared in chat should be rotated before using this version. Generate a session secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set `HARM_SESSION_SECRET` to the generated value. Set `MONGODB_URI` to a MongoDB database you control. The local inventory and transaction API requires this database; dashboard changes are not stored in the browser as a fallback. Set `NEXT_PUBLIC_WHATSAPP_NUMBER` to the shop’s country code and number using digits only, for example `91...`. The supplied phone number is a placeholder, so the public contact section intentionally asks the owner to add a phone number.

Then run:

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), use [http://localhost:3000/owner-login](http://localhost:3000/owner-login) to sign in, and open [http://localhost:3000/admin](http://localhost:3000/admin) for the private workspace. Production deployments must use HTTPS and server-side environment variables; never commit `.env.local`.

## Deploy on Render

The Render Blueprint is defined in `render.yaml`. Commit and push this file to the repository's `main` branch, then in Render choose **New → Blueprint** and select this repository. Render will create the web service using `npm ci`, `npm run build`, and `npm start`.

Before deploying, add the following private environment variables to the Render service: `MONGODB_URI`, `HARM_ADMIN_USERNAME`, and `HARM_ADMIN_PASSWORD`. The Blueprint generates `HARM_SESSION_SECRET`; set `NEXT_PUBLIC_WHATSAPP_NUMBER` to the shop number using digits only. Configure the MongoDB Atlas network access rules to allow connections from the deployed service. Never put secret values in `render.yaml` or commit `.env.local`.

## Owner access and data

- Login compares the configured username and password on the server, returns an explicit invalid-credentials message for a mismatch, rate-limits repeated failures, and signs an eight-hour `HttpOnly`, `SameSite=Strict` session cookie.
- Unauthenticated requests to `/admin` redirect to `/owner-login`. Signing out clears the session and redirects to the public homepage.
- The protected admin data API persists products, sales, and money-transfer records in separate MongoDB collections (`inventoryproducts`, `salerecords`, and `transferrecords`). The schemas in `models/StoreData.ts` document those records.
- The dashboard supports inventory create/edit/delete, stock thresholds, product-image uploads, product search and category filters, sales and counter-service entries, money-transfer records, CSV exports, browser print-to-PDF, and derived analytics. CSV files open in Excel.
- Customer and transaction records are sensitive. Use a private database with appropriate access controls, secure backups, and a retention policy. The sample dashboard does not initiate actual transfers, bill payments, AEPS, or recharges.

## Public-site content to personalize

- Replace the example WhatsApp number in `.env.local` with the business number.
- Add the real phone number before publishing. The provided `+91 XXXXXXXXXX` is only a placeholder.
- The location map and public contact details use Bandlaguda Jagir, Hyderabad.
- The homepage uses a product grid and stationery slideshow. Images are illustrative placeholders, not photographs of the shop.
- Product art is illustrative, not a photograph of the physical store. Use real shop and product images when available.
- No customer reviews are fabricated. Invite customers to share genuine feedback before adding testimonials.
- The app includes a web manifest and icon for installation metadata; it does not yet cache pages for offline use.

## Validation

```powershell
npm run check
npm run build
```

## Showroom refresh

The public header preserves the exact business name and tagline, followed by the six requested service labels. The homepage includes eight category links, a compact product grid, a stationery slideshow, public dark-mode toggle, and Bandlaguda Jagir contact/map details. The full catalog is available on `/shop`; long department lists, promotions, the gallery, and the why-choose-us section are not shown on the homepage. Availability labels invite enquiries rather than asserting stock.

The existing protected owner session remains in use. Firebase Authentication requires a configured Firebase project and has not been enabled. The UI uses existing custom components and Tailwind CSS; ShadCN has not been installed. Reports currently export Excel-compatible CSV and use browser printing for PDF. PWA installation metadata is present; offline caching is not implemented.

## Department browsing

The shared header uses hover dropdowns on desktop and explicit expand buttons for touch/keyboard users. Category links open `/shop?department=...&item=...`; `/shop?q=...` searches the complete directory. The catalog includes sidebar categories, name sorting, page-size selection, pagination, grid/list modes, and a native product-detail dialog. Catalog entries are category examples with illustrations and enquiry links, not live inventory or asserted prices.

## Stationery slideshow

The homepage slideshow uses the latest owner-supplied stationery images copied from the project root into `public/banners/`: stationery collection, stationery inspiration, creative supplies, and a school stationery set. The original project files remain unchanged. Previous family photos are no longer used in the slideshow. The carousel retains arrows, indicators, pause, hover/focus pausing, swipes and reduced-motion support. Product menus show hover previews and open the filtered catalog.

## Premium navigation refresh

The royal-purple navigation includes Home, Stationery, Print & Xerox, Gift Shop, Money Transfer, Daily Needs, Contact, and catalog search. The stationery dropdown has nine grouped sections in five columns on desktop, four columns at intermediate widths, and two columns on mobile. Product previews remain available on hover; explicit expand buttons support touch and keyboard access. Service badges appear beneath the brand tagline and in the hero. The confirmed full Bandlaguda Jagir address is retained.

Firebase Authentication still needs an owner Firebase project configuration. Existing signed owner sessions remain enabled. ShadCN UI has not been installed; the site continues to use its existing accessible custom React components. Exports remain Excel-compatible CSV and browser print-to-PDF; offline service-worker caching is not enabled.
