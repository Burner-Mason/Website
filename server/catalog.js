// Burner Mason — AUTHORITATIVE catalog (server-side source of truth).
//
// The browser sends only { sku, qty }. The server resolves price + weight from
// THIS file, so a tampered client can never change what is charged or shipped.
//
// `amount` is in cents and MUST match the Stripe price (priceId) it points to.
// `weightOz` is the packaged shipping weight used for live Shippo rating —
// adjust these to your real packed weights.

const CATALOG = {
  "balm-winter":   { name: "Lip Balm — Winter",   priceId: "price_1TfXxGKyfoKG2aQiiqZEfL7d", amount: 600,  weightOz: 1.5 },
  "balm-summer":   { name: "Lip Balm — Summer",   priceId: "price_1TfXxHKyfoKG2aQiqhbGyl5J", amount: 600,  weightOz: 1.5 },
  "balm-original": { name: "Lip Balm — Original", priceId: "price_1TfXxHKyfoKG2aQiDieOJmpp", amount: 600,  weightOz: 1.5 },
  "lip-oil":       { name: "Lip Oil",             priceId: "price_1TfXxHKyfoKG2aQi8I5icA0H", amount: 1200, weightOz: 2.5 },
  "sanitizer":     { name: "Hand Sanitizer",      priceId: "price_1TfXxIKyfoKG2aQixtBQeymy", amount: 800,  weightOz: 4.0 },
  "salve-day":     { name: "Hand Salve — Day",    priceId: "price_1TfXxIKyfoKG2aQirxRwHBd2", amount: 1400, weightOz: 4.0 },
  "salve-night":   { name: "Hand Salve — Night",  priceId: "price_1TfXxIKyfoKG2aQiMypB0s5M", amount: 1600, weightOz: 4.0 },
};

// Free shipping at or above this subtotal (cents).
const FREE_SHIPPING_THRESHOLD = 3500;

// Empty-box tare weight (oz) added to the packed items.
const BOX_TARE_OZ = 2;

// Default outer box dimensions (inches). Small handmade goods ship in one box.
const BOX_DIMS_IN = { length: 6, width: 4, height: 2 };

// Validate + normalize a client cart. Throws on anything unexpected.
// Returns [{ sku, qty, name, priceId, amount, weightOz, lineTotal }].
function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty.");
  }
  const out = [];
  for (const it of items) {
    const sku = String(it?.sku || "");
    const qty = Number(it?.qty);
    const p = CATALOG[sku];
    if (!p) throw new Error(`Unknown product: ${sku}`);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw new Error(`Invalid quantity for ${sku}`);
    }
    out.push({ sku, qty, ...p, lineTotal: p.amount * qty });
  }
  return out;
}

function subtotalCents(normItems) {
  return normItems.reduce((sum, l) => sum + l.lineTotal, 0);
}

// One parcel sized to the order's total weight.
function buildParcel(normItems) {
  const itemsOz = normItems.reduce((w, l) => w + l.weightOz * l.qty, 0);
  return {
    ...BOX_DIMS_IN,
    distance_unit: "in",
    weight: Number((itemsOz + BOX_TARE_OZ).toFixed(2)),
    mass_unit: "oz",
  };
}

module.exports = {
  CATALOG,
  FREE_SHIPPING_THRESHOLD,
  normalizeItems,
  subtotalCents,
  buildParcel,
};
