// Burner Mason — Cloud Run API.
// Routes: GET /health, POST /rates, POST /checkout, POST /webhook
//
// Secrets come ONLY from env (Secret Manager in production):
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SHIPPO_TOKEN
//   ALLOWED_ORIGIN (storefront origin), STOREFRONT_URL (for success/cancel),
//   BUSINESS_* (ship-from address)

const express = require("express");
const Stripe = require("stripe");
const {
  FREE_SHIPPING_THRESHOLD,
  normalizeItems,
  subtotalCents,
  buildParcel,
} = require("./catalog");
const shippo = require("./shippo");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const STOREFRONT_URL = (process.env.STOREFRONT_URL || "").replace(/\/$/, "");

// ---- CORS (storefront on GitHub Pages calls this API cross-origin) ----
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

// ---- Webhook needs the RAW body for signature verification, so mount it
//      BEFORE the JSON parser. ----
app.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

// JSON for everything else.
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

// ---- POST /rates : shipping options for a cart + address ----
app.post("/rates", async (req, res) => {
  try {
    const items = normalizeItems(req.body?.items);
    const address = req.body?.address || {};
    requireAddress(address);

    const subtotal = subtotalCents(items);

    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      return res.json({
        rates: [{ id: "free", label: "Free shipping", amount: 0, eta: "On us — orders over $35" }],
      });
    }

    const parcel = buildParcel(items);
    const rawRates = await shippo.getRates(address, parcel);
    if (!rawRates.length) {
      return res.status(422).json({ error: "No shipping rates available for that address." });
    }

    const rates = rawRates
      .map((r) => ({ id: r.object_id, label: shippo.rateLabel(r), amount: shippo.cents(r), eta: shippo.rateEta(r) }))
      .sort((a, b) => a.amount - b.amount)
      .slice(0, 3);

    res.json({ rates });
  } catch (err) {
    console.error("/rates error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// ---- POST /checkout : create a Stripe Checkout Session ----
app.post("/checkout", async (req, res) => {
  try {
    const items = normalizeItems(req.body?.items);
    const address = req.body?.address || {};
    requireAddress(address);
    const shippingRateId = String(req.body?.shippingRateId || "");

    const subtotal = subtotalCents(items);

    // Resolve the chosen shipping into an authoritative amount + display name.
    let shipAmount, shipLabel, shippoRateId;
    if (shippingRateId === "free") {
      if (subtotal < FREE_SHIPPING_THRESHOLD) {
        return res.status(400).json({ error: "Free shipping not available for this order." });
      }
      shipAmount = 0;
      shipLabel = "Free shipping";
      shippoRateId = "free";
    } else {
      const rate = await shippo.getRateById(shippingRateId); // re-fetch; never trust client amount
      shipAmount = shippo.cents(rate);
      shipLabel = shippo.rateLabel(rate);
      shippoRateId = shippingRateId;
    }

    const line_items = items.map((l) => ({ price: l.priceId, quantity: l.qty }));

    // Compact metadata the webhook will use to buy the label.
    const metadata = {
      shippo_rate_id: shippoRateId,
      items: items.map((l) => `${l.sku}:${l.qty}`).join(";"),
      ship_to: JSON.stringify({
        name: address.name,
        line1: address.line1,
        line2: address.line2 || "",
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country || "US",
        email: address.email || "",
      }).slice(0, 490),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      customer_email: address.email || undefined,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: shipAmount, currency: "usd" },
            display_name: shipLabel.slice(0, 100),
          },
        },
      ],
      payment_intent_data: {
        shipping: {
          name: address.name,
          address: {
            line1: address.line1,
            line2: address.line2 || undefined,
            city: address.city,
            state: address.state,
            postal_code: address.zip,
            country: address.country || "US",
          },
        },
      },
      metadata,
      success_url: `${STOREFRONT_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${STOREFRONT_URL}/cancel.html`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("/checkout error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// ---- POST /webhook : on paid order, auto-buy the Shippo label ----
async function handleWebhook(req, res) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw Buffer
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Acknowledge immediately-ish; fulfillment failures are logged for manual handling
  // so Stripe doesn't retry into a double-label.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      await fulfill(session);
    } catch (err) {
      console.error(`Fulfillment failed for session ${session.id}:`, err.message);
    }
  }

  res.json({ received: true });
}

async function fulfill(session) {
  const md = session.metadata || {};
  const shippoRateId = md.shippo_rate_id;
  let rateId = shippoRateId;

  // Free-shipping orders had no customer-selected Shippo rate — rate it now and
  // buy the cheapest (we absorb the cost).
  if (!shippoRateId || shippoRateId === "free") {
    const address = JSON.parse(md.ship_to || "{}");
    const items = normalizeItems(
      (md.items || "")
        .split(";")
        .filter(Boolean)
        .map((pair) => {
          const [sku, qty] = pair.split(":");
          return { sku, qty: Number(qty) };
        })
    );
    const parcel = buildParcel(items);
    const rates = await shippo.getRates(address, parcel);
    if (!rates.length) throw new Error("No rates available to fulfill free-shipping order");
    rateId = rates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))[0].object_id;
  }

  const tx = await shippo.buyLabel(rateId, `stripe_session:${session.id}`);
  if (tx.status === "SUCCESS") {
    console.log(`Label bought for ${session.id}: tracking=${tx.tracking_number} label=${tx.label_url}`);
  } else {
    throw new Error(`Shippo transaction status=${tx.status} messages=${JSON.stringify(tx.messages || [])}`);
  }
}

// ---- helpers ----
function requireAddress(a) {
  for (const f of ["name", "line1", "city", "state", "zip"]) {
    if (!a?.[f] || !String(a[f]).trim()) throw new Error(`Missing address field: ${f}`);
  }
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Burner Mason API listening on :${PORT}`));
