// Burner Mason — front-end configuration.
// This file ships to the browser, so it must contain ONLY public values.
// NEVER put your Stripe secret key (sk_...) or Shippo token here.

window.BM_CONFIG = {
  // Deployed Cloud Run function URLs. Each function serves its handler at the
  // root path (POST /). Paste the URLs printed by Terraform / gcloud after deploy.
  //   RATES_URL    → bm-fn-rates service URL
  //   CHECKOUT_URL → bm-fn-checkout service URL
  // (The webhook URL is set in the Stripe Dashboard, not here.)
  RATES_URL: "https://bm-fn-rates-hv6igyon7q-uc.a.run.app",
  CHECKOUT_URL: "https://bm-fn-checkout-hv6igyon7q-uc.a.run.app",

  // Stripe PUBLISHABLE key (safe to expose). LIVE key for "Burner Mason, Inc."
  // (acct_1TfVqH…). Must be paired with the live sk_live_… secret key in the
  // checkout function (Secret Manager: stripe-secret-key) — a live pk with a test
  // sk fails every payment.
  STRIPE_PUBLISHABLE_KEY:
    "pk_live_51TfVqHRVq1nddwvL9f7hRxZJku0Ec41RaFfbusQWGfdQRCsZsSYk7pIDG4a6WJyAYm2ez074kpn9nqlEcjXdVHjz0008JNKO8S",

  // Free shipping kicks in at or above this subtotal (in cents). Display only;
  // the backend enforces the real rule.
  FREE_SHIPPING_THRESHOLD: 3500,
};
