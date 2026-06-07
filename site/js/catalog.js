// Burner Mason — product catalog (display data).
// Prices and price IDs are public and safe to ship to the browser.
// The BACKEND keeps its own authoritative copy (server/catalog.js) and never
// trusts prices sent from here — this list is purely for rendering.

window.BM_CATALOG = [
  {
    sku: "balm-winter",
    name: "Lip Balm — Winter",
    group: "Lips",
    price: 600,
    priceId: "price_1TfXxGKyfoKG2aQiiqZEfL7d",
    blurb: "Stays soft in the cold.",
    desc: "A winter balm that never freezes hard, so it glides on even at the bottom of a January morning.",
  },
  {
    sku: "balm-summer",
    name: "Lip Balm — Summer",
    group: "Lips",
    price: 600,
    priceId: "price_1TfXxHKyfoKG2aQiqhbGyl5J",
    blurb: "Holds up in the heat.",
    desc: "Built to stay put when it's hot. No melting down in a pocket or a glovebox.",
  },
  {
    sku: "balm-original",
    name: "Lip Balm — Original",
    group: "Lips",
    price: 600,
    priceId: "price_1TfXxHKyfoKG2aQiDieOJmpp",
    blurb: "The everyday balm.",
    desc: "Simple, clean, all-season. The one you reach for without thinking.",
  },
  {
    sku: "lip-oil",
    name: "Lip Oil",
    group: "Lips",
    price: 1200,
    priceId: "price_1TfXxHKyfoKG2aQi8I5icA0H",
    blurb: "A glossy, nourishing shine.",
    desc: "A lightweight oil that leaves a soft, glassy shine while it conditions.",
  },
  {
    sku: "sanitizer",
    name: "Hand Sanitizer",
    group: "Hands",
    price: 800,
    priceId: "price_1TfXxIKyfoKG2aQixtBQeymy",
    blurb: "Clean hands, not dry hands.",
    desc: "Kills germs without that tight, cracked feeling. Leaves hands soft.",
  },
  {
    sku: "salve-day",
    name: "Hand Salve — Day",
    group: "Hands",
    price: 1400,
    priceId: "price_1TfXxIKyfoKG2aQirxRwHBd2",
    blurb: "Protected, never greasy.",
    desc: "A daytime salve that keeps hands dry and protected and sinks in without a slick.",
  },
  {
    sku: "salve-night",
    name: "Hand Salve — Night",
    group: "Hands",
    price: 1600,
    priceId: "price_1TfXxIKyfoKG2aQiMypB0s5M",
    blurb: "Overnight repair.",
    desc: "A richer overnight salve. Put it on before bed and wake up to restored hands.",
  },
];
