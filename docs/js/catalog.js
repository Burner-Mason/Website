// Burner Mason — product catalog (display data).
// Prices and price IDs are public and safe to ship to the browser.
// The BACKEND keeps its own authoritative copy (server/catalog.js) and never
// trusts prices sent from here — this list is purely for rendering.
//
// Copy approach (informed by DTC practitioners with real track records):
//   - `blurb`  : 2-4 word hook for the card (the fast scan).
//   - `desc`   : the one-sentence "why" — what it does + how it benefits you,
//                in plain language (the "grandma test").
//   - `detail` : a couple of honest, specific sentences (the story / how it's
//                made) for the product page. Benefits over ingredient lists.
//   - `image`  : the product photo ID (see assets/products/). To re-assign a
//                photo to a product, just change this one string — the card
//                and hero derivatives (-card / -hero, .webp + .jpg) are built
//                from it automatically. Available photo IDs:
//                  img-9847 = spray bottle (Hand Sanitizer)
//                  img-9856 = open tin, teal product
//                  img-9857 = open tin, peach/orange product
//                  img-9852 = closed silver tin
//                  img-9842 = clear tube, coral product (textured background)
//                  img-9845 = clear tube, coral product (plain background)
//                  img-9864 = clear tube, yellow product (Balm)
//                  img-9865 = blue lip oil bottle (Lip Oil)

window.BM_CATALOG = [
  {
    sku: "balm-summer",
    image: "img-9842",
    name: "Summer Balm",
    group: "Lips",
    price: 600,
    priceId: "price_1TkZ0mRVq1nddwvLzNZU3PXN",
    blurb: "Won't melt in your bag.",
    desc: "A higher-melt lip balm that holds its shape in the heat — so a hot car or a back pocket doesn't turn it to soup.",
    detail:
      "Built and tested through summer for people who keep a balm where things get warm. Same clean, soft feel as our other balms — just engineered to stay put.",
  },
  {
    sku: "balm-original",
    image: "img-9864",
    name: "Balm",
    group: "Lips",
    price: 600,
    priceId: "price_1TkZ0IRVq1nddwvLF7XLva0e",
    blurb: "Your everyday ride-or-die.",
    desc: "The simple, all-season lip balm you reach for without thinking — balanced, unscented, and quietly good.",
    detail:
      "The one to start with. The middle of our range: soft in the cold, steady in the heat, and nothing you have to think about.",
  },
  {
    sku: "balm-winter",
    comingSoon: true,
    name: "Winter Balm",
    group: "Lips",
    price: 600,
    priceId: "price_1TkZ0aRVq1nddwvLiILFkCL2",
    blurb: "Won't quit in the cold.",
    desc: "A lip balm that stays soft and spreadable in the cold — so it actually works when your lips are chapped and the thermometer isn't cooperating.",
    detail:
      "We reformulated this through real Washington winters until the wax-and-oil blend stopped turning to stone at the bottom of a coat pocket. It glides on at temperatures where ordinary balm just drags.",
  },
  {
    sku: "lip-oil",
    image: "img-9865",
    name: "Lip Oil",
    group: "Lips",
    price: 1200,
    priceId: "price_1TkZ0wRVq1nddwvLt5vTL4jx",
    blurb: "Glossy, never sticky.",
    desc: "A lightweight lip oil that leaves a soft, glassy shine while it conditions — glossy, never sticky.",
    detail:
      "Sheer and clear, so it layers over a balm or wears on its own. The shine people notice, without the tack that makes your hair stick to your lips.",
  },
  {
    sku: "sanitizer",
    image: "img-9847",
    name: "Hand Sanitizer",
    group: "Hands",
    price: 800,
    priceId: "price_1TkZ1ARVq1nddwvLR96BoZdW",
    blurb: "Clean hands, zero crackle.",
    desc: "A hand sanitizer with enough alcohol to do the job and enough oils to undo the damage — so clean hands don't end up dry and cracked.",
    detail:
      "Most sanitizer leaves skin tight and stripped. We put the moisturizers back in, so you can use it all day and still have soft hands at the end of it.",
  },
  {
    sku: "salve-day",
    image: "img-9857",
    name: "Hand Salve — Day",
    group: "Hands",
    price: 1400,
    priceId: "price_1TkZ1LRVq1nddwvLYTyXxJsY",
    blurb: "Soaks in, no grease.",
    desc: "A fast-absorbing daytime hand salve that protects working hands and sinks in clean — no slick, no residue on everything you touch.",
    detail:
      "For hands that work. It soaks in quickly so you can get right back to it — without leaving a greasy print on your phone, your tools, or your keyboard.",
  },
  {
    sku: "salve-night",
    image: "img-9856",
    name: "Hand Salve — Night",
    group: "Hands",
    price: 1600,
    priceId: "price_1TkZ1URVq1nddwvLLogvNBGL",
    blurb: "Wake up to softer hands.",
    desc: "A rich overnight hand salve that works while you sleep — so you wake up to hands that feel genuinely repaired.",
    detail:
      "The heavy one, on purpose. Layer it on before bed; it's richer than the day salve because it has all night to absorb and rebuild dry, worn skin.",
  },
];

// Build a <picture> for a product photo. `size` is "card" or "hero".
// Serves WebP with a JPG fallback; lazy-loads by default (eager for hero).
window.bmProductImage = function (product, size, eager) {
  const pic = document.createElement("picture");
  if (!product || !product.image) return pic; // graceful no-op if unmapped
  const base = `assets/products/${product.image}-${size}`;
  const src = document.createElement("source");
  src.type = "image/webp";
  src.srcset = `${base}.webp`;
  const img = document.createElement("img");
  img.src = `${base}.jpg`;
  img.alt = product.name;
  img.loading = eager ? "eager" : "lazy";
  img.decoding = "async";
  pic.append(src, img);
  return pic;
};

// Placeholder for products that are buyable but not yet photographed.
// `big` = product-hero size. Theme-aware, no raster asset needed.
window.bmComingSoon = function (product, big) {
  const wrap = document.createElement("span");
  wrap.className = "soon" + (big ? " soon-big" : "");
  const mark = document.createElement("span");
  mark.className = "soon-mark";
  mark.textContent = "✨";
  const label = document.createElement("span");
  label.className = "soon-label";
  label.textContent = "Images coming soon";
  wrap.append(mark, label);
  return wrap;
};
