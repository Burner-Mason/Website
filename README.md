# Burner Mason

Handmade lip & hand care store. Static storefront on **GitHub Pages**, serverless
backend on **GCP Cloud Run**, payments via **Stripe**, shipping rates + labels via **Shippo**.

```
docs/      → static storefront (served by GitHub Pages from the /docs folder)
server/    → Node/Express API (Cloud Run): /rates, /checkout, /webhook
specs/     → design spec
```

The storefront adapts to **light or dark automatically** based on the visitor's system
setting (`prefers-color-scheme`) — no toggle, no preference stored.

## How it works

1. A patron browses `docs/` and adds products to a localStorage cart.
2. At checkout they enter their address on our page.
3. The browser calls **`POST /rates`**:
   - subtotal **≥ $35** → one free-shipping option.
   - subtotal **< $35** → live Shippo carrier rates.
4. They pick a rate; the browser calls **`POST /checkout`**, which creates a Stripe
   Checkout Session (prices rebuilt server-side; chosen shipping locked in) and returns
   the Stripe URL. The patron pays on Stripe's hosted page.
5. Stripe fires **`POST /webhook`** → the server tells Shippo to **buy the label**
   automatically (the exact rate the patron paid, or the cheapest for free-shipping
   orders). Label + tracking appear in your Shippo dashboard.

### Security model
- The Stripe **secret key**, Shippo token, and webhook secret live ONLY in Cloud Run env
  (Secret Manager). They are never in this repo or the browser.
- The browser only ever holds the Stripe **publishable** key (safe by design).
- The server never trusts client-sent prices — it rebuilds every line item and shipping
  amount from `server/catalog.js` and by re-fetching the chosen Shippo rate.

---

## The products (already created in Stripe — TEST mode)

| SKU | Name | Price | Stripe Price ID |
|---|---|---|---|
| balm-winter | Winter Balm | $6 | price_1TfXxGKyfoKG2aQiiqZEfL7d |
| balm-summer | Summer Balm | $6 | price_1TfXxHKyfoKG2aQiqhbGyl5J |
| balm-original | Balm | $6 | price_1TfXxHKyfoKG2aQiDieOJmpp |
| lip-oil | Lip Oil | $12 | price_1TfXxHKyfoKG2aQi8I5icA0H |
| sanitizer | Hand Sanitizer | $8 | price_1TfXxIKyfoKG2aQixtBQeymy |
| salve-day | Hand Salve — Day | $14 | price_1TfXxIKyfoKG2aQirxRwHBd2 |
| salve-night | Hand Salve — Night | $16 | price_1TfXxIKyfoKG2aQiMypB0s5M |

Prices live in three places that MUST agree: Stripe, `server/catalog.js`, and
`docs/js/catalog.js`. To change a price, update the Stripe price (or make a new one) and
edit both catalog files.

---

## Local development

```bash
# 1) Backend
cd server
cp .env.example .env        # fill in your TEST keys + ship-from address
npm install
npm run dev                 # http://localhost:8080

# 2) Frontend (separate terminal) — config.js already points at localhost:8080
cd docs
python3 -m http.server 8077 # http://localhost:8077
```

Test Stripe payments with card `4242 4242 4242 4242`, any future expiry, any CVC.

### Forwarding webhooks locally
```bash
stripe login
stripe listen --forward-to localhost:8080/webhook
# copy the printed whsec_... into server/.env as STRIPE_WEBHOOK_SECRET
```

---

## Deploy the backend → GCP Cloud Run

> One-time: install the gcloud CLI and run `gcloud auth login`.

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com

# Store secrets (recommended over plain env vars)
printf '%s' 'sk_test_xxx'      | gcloud secrets create STRIPE_SECRET_KEY     --data-file=-
printf '%s' 'shippo_test_xxx'  | gcloud secrets create SHIPPO_TOKEN          --data-file=-
printf '%s' 'whsec_xxx'        | gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-

# Deploy from the server/ directory (source-based build, no Docker needed locally)
cd server
gcloud run deploy burner-mason-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets "STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,SHIPPO_TOKEN=SHIPPO_TOKEN:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest" \
  --set-env-vars "ALLOWED_ORIGIN=https://burnermason.com,STOREFRONT_URL=https://burnermason.com,BUSINESS_NAME=Burner Mason,BUSINESS_STREET1=...,BUSINESS_CITY=...,BUSINESS_STATE=...,BUSINESS_ZIP=...,BUSINESS_COUNTRY=US,BUSINESS_EMAIL=spook@spookylabs.ai"
```

`gcloud` prints a service URL like `https://burner-mason-api-xxxx-uc.a.run.app`. Then:

1. Put that URL in **`docs/js/config.js`** → `API_BASE`.
2. Register the webhook in Stripe (Dashboard → Developers → Webhooks → Add endpoint):
   - URL: `https://burner-mason-api-xxxx-uc.a.run.app/webhook`
   - Event: `checkout.session.completed`
   - Copy the signing secret (`whsec_...`) into the `STRIPE_WEBHOOK_SECRET` secret and
     redeploy (or `gcloud secrets versions add`).

> **Important on CORS/URLs:** `STOREFRONT_URL` is your live Pages URL. If you serve the
> site at a custom domain (you own one), use that for both `ALLOWED_ORIGIN` and
> `STOREFRONT_URL`. `ALLOWED_ORIGIN` is just the origin (scheme + host), no path.

---

## Deploy the storefront → GitHub Pages (from `/docs`)

1. Push this repo to GitHub.
2. Repo **Settings → Pages → Build and deployment**:
   - **Source: Deploy from a branch**
   - **Branch: `main`**, **Folder: `/docs`** → Save.
3. GitHub publishes the contents of `docs/` at the root of your Pages URL
   (`https://YOURUSER.github.io/REPO/`) within a minute or two. Every push to `main` that
   touches `docs/` re-publishes automatically.
4. **Custom domain:** the site uses **burnermason.com** (apex). `docs/CNAME` holds the
   domain so it survives redeploys, and it's set on the GitHub side. Point DNS at GitHub
   Pages with these records on the apex (`@`):
   - **A:** `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - **AAAA:** `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - Optional **CNAME** `www` → `burner-mason.github.io`
   Once DNS resolves, enable **Enforce HTTPS** in Settings → Pages. `ALLOWED_ORIGIN` and
   `STOREFRONT_URL` on Cloud Run are already set to `https://burnermason.com`.

---

## Going live (test → live)

1. In Stripe, flip to **live mode** and recreate the 7 products/prices (or use the same
   if created in live). Update the price IDs in both catalog files.
2. Swap `STRIPE_PUBLISHABLE_KEY` in `docs/js/config.js` to your `pk_live_...`.
3. Update the `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secrets to live values and
   redeploy.
4. Switch `SHIPPO_TOKEN` from `shippo_test_...` to your live token. Live tokens buy REAL
   labels and charge your Shippo balance.
5. **Rotate the test secret key** that was shared during setup (Stripe Dashboard →
   Developers → API keys → roll).

## Tuning shipping
- Free-shipping threshold and package weights/box size live in `server/catalog.js`.
- Set accurate `weightOz` per product so live Shippo rates are correct.

## Notes / future work
- Webhook fulfillment logs label URL + tracking to Cloud Run logs and records the label in
  Shippo. If a label purchase fails, the order is still paid — buy the label manually in
  Shippo. (Stripe may deliver an event more than once; for high volume add idempotency
  keyed on the Stripe session id before buying.)
- No product photos yet (intentional, unlabeled brand). Drop images into `docs/assets/`
  and extend the product cards in `docs/js/store.js` / `docs/product.html` when ready.
- Theme: light/dark toggle in the navbar (`docs/js/theme.js`) that **defaults to the
  visitor's system setting** and remembers an explicit choice in `localStorage`. A tiny
  inline script in each page's `<head>` applies the saved theme before first paint (no
  flash). Colors are CSS variables in `docs/assets/styles.css` — `:root` (light), the
  `@media (prefers-color-scheme: dark)` block (system dark), and `:root[data-theme=...]`
  (manual override). Keep the two dark blocks in sync.

## Pages
- `index.html` — storefront (hero, product grids, About teaser)
- `product.html?sku=<sku>` — one template renders every product page from the catalog
- `about.html` — brand story
- `checkout.html` / `success.html` / `cancel.html` — checkout flow
- `privacy.html` / `terms.html` — legal

## Copy & marketing
Product/About copy follows guidance from DTC operators with real track records — Ezra
Firestone (BOOM! by Cindy Joseph), Nik Sharma, and Baymard Institute UX research:
benefit-led, plain-language ("grandma test"), one-sentence "why" per product, honest
specific promises, and a story-driven About page. Edit copy in `docs/js/catalog.js`
(`blurb`/`desc`/`detail`) and `docs/about.html`.

**Highest-ROI things to add next** (per that same research):
1. **Real customer reviews / social proof** on product pages — the single biggest
   conversion lever. We intentionally did NOT fabricate any. Collect real ones and add a
   short "what patrons say" block.
2. **Simple, in-scale product photos** (even on a plain background) — Baymard finds images
   are critical for confidence; show the tube/jar next to something for scale.

## Legal (review before launch)
`privacy.html` and `terms.html` are competent, business-specific templates — **not legal
advice.** Have a lawyer review them. Confirm the bracketed placeholders: the legal entity
name (after Stripe Atlas completes), the governing-law state (currently `[Washington]`),
and the return window (`[30]` days). Update the "Last updated" dates if you change them.
