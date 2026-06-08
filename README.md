# Burner Mason — Website

The static storefront for Burner Mason, served by **GitHub Pages** from `/docs` at
**https://burnermason.com**. Handmade lip & hand care; payments via **Stripe**, shipping
via **Shippo**. The backend and infrastructure live in separate repos (see below).

```
docs/      → static storefront (GitHub Pages serves this folder)
specs/     → design spec
```

The storefront has a light/dark toggle that **defaults to the visitor's system setting**.

## Related repositories
This is part of a multi-repo setup under the **Burner-Mason** org:

| Repo | Purpose |
|---|---|
| **Website** (this) | Static storefront on GitHub Pages |
| **infrastructure** | Terraform: GCP project, APIs, Artifact Registry, Secret Manager, the three Cloud Run services, IAM |
| **bm-fn-rates** | Cloud Run function: shipping rates (`POST /`) |
| **bm-fn-checkout** | Cloud Run function: creates the Stripe Checkout Session |
| **bm-fn-webhook** | Cloud Run function: Stripe webhook → buys the Shippo label |

## How checkout works
1. A patron browses `docs/` and adds products to a localStorage cart.
2. At checkout they enter their address; the browser calls the **rates** function.
   - subtotal **≥ $35** → free shipping; **< $35** → live Shippo rates.
3. They pick a rate; the browser calls the **checkout** function, which creates a Stripe
   Checkout Session and returns the Stripe URL. The patron pays on Stripe's hosted page.
4. Stripe calls the **webhook** function, which tells Shippo to buy the label.

The frontend only ever holds the Stripe **publishable** key (safe). Secret keys live in
GCP Secret Manager, wired into the functions by Terraform.

### Wiring the functions in (after they're deployed)
Set the deployed function URLs in **`docs/js/config.js`**:
- `RATES_URL` → bm-fn-rates URL
- `CHECKOUT_URL` → bm-fn-checkout URL

(The webhook URL is configured in the Stripe Dashboard, not the frontend.)

## The products (Stripe TEST mode)
| SKU | Name | Price | Stripe Price ID |
|---|---|---|---|
| balm-winter | Winter Balm | $6 | price_1TfXxGKyfoKG2aQiiqZEfL7d |
| balm-summer | Summer Balm | $6 | price_1TfXxHKyfoKG2aQiqhbGyl5J |
| balm-original | Balm | $6 | price_1TfXxHKyfoKG2aQiDieOJmpp |
| lip-oil | Lip Oil | $12 | price_1TfXxHKyfoKG2aQi8I5icA0H |
| sanitizer | Hand Sanitizer | $8 | price_1TfXxIKyfoKG2aQixtBQeymy |
| salve-day | Hand Salve — Day | $14 | price_1TfXxIKyfoKG2aQirxRwHBd2 |
| salve-night | Hand Salve — Night | $16 | price_1TfXxIKyfoKG2aQiMypB0s5M |

Prices must agree in three places: Stripe, `docs/js/catalog.js` (display), and each
function's `catalog.js` (authoritative). Changing a price means updating all three.

## Local development
```bash
cd docs
python3 -m http.server 8077   # http://localhost:8077
```
Point `docs/js/config.js` at local function instances (or the deployed URLs) to exercise
checkout. Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC.

## Deploy (GitHub Pages, from /docs)
Already configured: **Settings → Pages → Deploy from a branch → `main` / `/docs`**, custom
domain **burnermason.com** (apex), `docs/CNAME` committed, Enforce HTTPS on. Apex DNS:
- **A:** `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- **AAAA:** `2606:50c0:8000::153` … `2606:50c0:8003::153`

## Pages
- `index.html` — storefront (hero, product grids, About teaser)
- `product.html?sku=<sku>` — one template renders every product page from the catalog
- `about.html` — brand story · `privacy.html` / `terms.html` — legal
- `checkout.html` / `success.html` / `cancel.html` — checkout flow

## Theme
Light/dark toggle in the navbar (`docs/js/theme.js`) defaults to the system setting and
remembers an explicit choice in `localStorage`; a tiny inline `<head>` script applies it
before first paint. Colors are CSS variables in `docs/assets/styles.css` — `:root`
(light), `@media (prefers-color-scheme: dark)` (system dark), `:root[data-theme=…]`
(manual override).

## Copy & marketing
Copy follows DTC operators with real track records — Ezra Firestone (BOOM! by Cindy
Joseph), Nik Sharma, Baymard Institute: benefit-led, plain-language ("grandma test"),
one-sentence "why" per product, honest promises, story-driven About. Edit in
`docs/js/catalog.js` (`blurb`/`desc`/`detail`) and `docs/about.html`.

**Highest-ROI things to add next** (same research): (1) real customer reviews on product
pages — the biggest conversion lever (none were fabricated); (2) simple in-scale product
photos.

## Legal (review before launch)
`privacy.html` / `terms.html` are competent, business-specific templates — **not legal
advice.** Have a lawyer review. Confirm placeholders: legal entity (after Stripe Atlas),
governing-law state (`[Washington]`), return window (`[30]` days).

## Going live (test → live)
1. Stripe → live mode; recreate the 7 products/prices; update the price IDs everywhere.
2. Swap `STRIPE_PUBLISHABLE_KEY` in `docs/js/config.js` to `pk_live_…`.
3. Update the secret values in GCP Secret Manager (handled in the infrastructure repo).
4. Switch Shippo to a live token (buys REAL labels).
5. **Rotate the test secret key** shared during setup.
