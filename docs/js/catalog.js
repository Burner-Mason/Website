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

window.BM_CATALOG = [
  {
    sku: "balm-original",
    name: "Balm",
    group: "Lips",
    price: 600,
    priceId: "price_1TfXxHKyfoKG2aQiDieOJmpp",
    blurb: "The everyday one.",
    desc: "The simple, all-season lip balm you reach for without thinking — balanced, unscented, and quietly good.",
    detail:
      "The one to start with. The middle of our range: soft in the cold, steady in the heat, and nothing you have to think about.",
  },
  {
    sku: "balm-winter",
    name: "Winter Balm",
    group: "Lips",
    price: 600,
    priceId: "price_1TfXxGKyfoKG2aQiiqZEfL7d",
    blurb: "Won't freeze stiff.",
    desc: "A lip balm that stays soft and spreadable in the cold — so it actually works when your lips are chapped and the thermometer isn't cooperating.",
    detail:
      "We reformulated this through real Washington winters until the wax-and-oil blend stopped turning to stone at the bottom of a coat pocket. It glides on at temperatures where ordinary balm just drags.",
  },
  {
    sku: "balm-summer",
    name: "Summer Balm",
    group: "Lips",
    price: 600,
    priceId: "price_1TfXxHKyfoKG2aQiqhbGyl5J",
    blurb: "Won't melt down.",
    desc: "A higher-melt lip balm that holds its shape in the heat — so a hot car or a back pocket doesn't turn it to soup.",
    detail:
      "Built and tested through summer for people who keep a balm where things get warm. Same clean, soft feel as our other balms — just engineered to stay put.",
  },
  {
    sku: "lip-oil",
    name: "Lip Oil",
    group: "Lips",
    price: 1200,
    priceId: "price_1TfXxHKyfoKG2aQi8I5icA0H",
    blurb: "Soft, glassy shine.",
    desc: "A lightweight lip oil that leaves a soft, glassy shine while it conditions — glossy, never sticky.",
    detail:
      "Sheer and clear, so it layers over a balm or wears on its own. The shine people notice, without the tack that makes your hair stick to your lips.",
  },
  {
    sku: "sanitizer",
    name: "Hand Sanitizer",
    group: "Hands",
    price: 800,
    priceId: "price_1TfXxIKyfoKG2aQixtBQeymy",
    blurb: "Clean, not cracked.",
    desc: "A hand sanitizer with enough alcohol to do the job and enough oils to undo the damage — so clean hands don't end up dry and cracked.",
    detail:
      "Most sanitizer leaves skin tight and stripped. We put the moisturizers back in, so you can use it all day and still have soft hands at the end of it.",
  },
  {
    sku: "salve-day",
    name: "Hand Salve — Day",
    group: "Hands",
    price: 1400,
    priceId: "price_1TfXxIKyfoKG2aQirxRwHBd2",
    blurb: "Protects, not greasy.",
    desc: "A fast-absorbing daytime hand salve that protects working hands and sinks in clean — no slick, no residue on everything you touch.",
    detail:
      "For hands that work. It soaks in quickly so you can get right back to it — without leaving a greasy print on your phone, your tools, or your keyboard.",
  },
  {
    sku: "salve-night",
    name: "Hand Salve — Night",
    group: "Hands",
    price: 1600,
    priceId: "price_1TfXxIKyfoKG2aQiMypB0s5M",
    blurb: "Overnight repair.",
    desc: "A rich overnight hand salve that works while you sleep — so you wake up to hands that feel genuinely repaired.",
    detail:
      "The heavy one, on purpose. Layer it on before bed; it's richer than the day salve because it has all night to absorb and rebuild dry, worn skin.",
  },
];
