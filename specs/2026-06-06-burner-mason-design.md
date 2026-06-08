# Burner Mason — Store Design Spec

**Date:** 2026-06-06
**Status:** Approved, building

## Summary
A small e-commerce storefront for Burner Mason, a handmade lip & hand care brand
with deliberately "brandless," minimal branding. Static storefront on GitHub Pages,
a serverless backend on GCP Cloud Run for shipping rates, payment session creation,
and automated fulfillment.

## Products (Stripe test mode)
| SKU            | Name                | Price |
|----------------|---------------------|-------|
| balm-winter    | Lip Balm — Winter   | $6    |
| balm-summer    | Lip Balm — Summer   | $6    |
| balm-original  | Lip Balm — Original | $6    |
| lip-oil        | Lip Oil             | $12   |
| sanitizer      | Hand Sanitizer      | $8    |
| salve-day      | Hand Salve — Day    | $14   |
| salve-night    | Hand Salve — Night  | $16   |

## Architecture
- **Frontend → GitHub Pages** (static HTML/CSS/JS, no framework). Holds the catalog,
  a localStorage cart, and a custom checkout flow. Only the Stripe **publishable** key
  is exposed here (safe by design).
- **Backend → GCP Cloud Run** (single Node/Express service). The only place the Stripe
  **secret** key, Shippo token, and webhook secret live (via env / Secret Manager).
  Three routes:
  - `POST /rates` — given cart + address, returns shipping options
  - `POST /checkout` — creates a Stripe Checkout Session with chosen shipping locked in
  - `POST /webhook` — on paid order, buys the Shippo label automatically

## Checkout flow
1. Browse → add to cart (localStorage).
2. Cart → checkout page → enter shipping address on our site.
3. `POST /rates`:
   - subtotal **≥ $35** → one "Free shipping — $0" option.
   - subtotal **< $35** → live Shippo carrier rates (cheapest few).
4. Customer picks a rate.
5. `POST /checkout` → Stripe Checkout Session (line items rebuilt server-side from the
   authoritative catalog; chosen shipping added as a fixed_amount shipping_option; the
   ship-to address + chosen Shippo rate id stored in session metadata) → redirect to
   Stripe-hosted payment page.
6. Pay → return to `success.html` (cart cleared).

## Fulfillment (automated)
On `checkout.session.completed`:
- If a Shippo rate id is in metadata (paid live rate) → buy that exact label.
- Else (free shipping) → re-rate from stored address + parcel, buy the cheapest.
- Label + tracking land in the Shippo dashboard; Shippo emails the customer tracking.

## Security model
- Secret key never touches the repo or the browser. Lives in Cloud Run env / Secret Manager.
- Backend never trusts client-sent prices: it rebuilds line items and shipping amounts from
  its own catalog and by re-fetching the chosen Shippo rate.
- Stripe webhook signature verified with `STRIPE_WEBHOOK_SECRET`.
- CORS restricts the API to the storefront origin.

## Config the operator provides (clearly marked slots)
- `site/js/config.js`: Cloud Run API base URL, Stripe publishable key (test key prefilled).
- Cloud Run env: `STRIPE_SECRET_KEY`, `SHIPPO_TOKEN`, `STRIPE_WEBHOOK_SECRET`,
  `ALLOWED_ORIGIN`, and `BUSINESS_*` ship-from address fields.
- Product package weights live in `server/catalog.js` (sensible defaults prefilled).

## Branding
Warm minimal: cream background, charcoal text, one muted clay accent, quiet serif
headings, generous whitespace. No product photos required; typographic product cards.
