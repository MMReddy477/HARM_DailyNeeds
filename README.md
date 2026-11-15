# H.A.R.M Daily Needs

A responsive Next.js 15 storefront and private owner workspace for H.A.R.M Daily Needs in Bachupally, Hyderabad. The public website has service discovery, stationery product highlights without public prices, a WhatsApp call to action, contact details, and responsive navigation. `/owner-login` is the only owner-login link; `/admin` and its data API require a signed, HTTP-only session.

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

## Owner access and data

- Login compares the configured username and password on the server, returns an explicit invalid-credentials message for a mismatch, rate-limits repeated failures, and signs an eight-hour `HttpOnly`, `SameSite=Strict` session cookie.
- Unauthenticated requests to `/admin` redirect to `/owner-login`. Signing out clears the session and redirects to the public homepage.
- The protected admin data API persists products, sales, and money-transfer records in separate MongoDB collections (`inventoryproducts`, `salerecords`, and `transferrecords`). The schemas in `models/StoreData.ts` document those records.
- The dashboard supports inventory create/edit/delete, stock thresholds, product-image uploads, product search and category filters, sales and counter-service entries, money-transfer records, CSV exports, browser print-to-PDF, and derived analytics. CSV files open in Excel.
- Customer and transaction records are sensitive. Use a private database with appropriate access controls, secure backups, and a retention policy. The sample dashboard does not initiate actual transfers, bill payments, AEPS, or recharges.

## Public-site content to personalize

- Replace the example WhatsApp number in `.env.local` with the business number.
- Add the real phone number before publishing. The provided `+91 XXXXXXXXXX` is only a placeholder.
- The location map points to Bachupally, Hyderabad; update it to the shop’s exact address when available.
- The homepage currently features the family photo provided by the owner at `public/family-welcome.jpeg`. It is publicly visible. Replace/remove it if publication permission changes.
- Product/gallery art is illustrative, not a photograph of the physical store. Use real shop and product images when available.
- No customer reviews are fabricated. Invite customers to share genuine feedback before adding testimonials.
- The app includes a web manifest and icon for installation metadata; it does not yet cache pages for offline use.

## Validation

```powershell
npm run check
npm run build
```
