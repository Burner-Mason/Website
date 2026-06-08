// Burner Mason — front-end configuration.
// This file ships to the browser, so it must contain ONLY public values.
// NEVER put your Stripe secret key (sk_...) or Shippo token here.

window.BM_CONFIG = {
  // Deployed Cloud Run function URLs. Each function serves its handler at the
  // root path (POST /). Paste the URLs printed by Terraform / gcloud after deploy.
  //   RATES_URL    → bm-fn-rates service URL
  //   CHECKOUT_URL → bm-fn-checkout service URL
  // (The webhook URL is set in the Stripe Dashboard, not here.)
  RATES_URL: "http://localhost:8081",
  CHECKOUT_URL: "http://localhost:8082",

  // Stripe PUBLISHABLE key (safe to expose). This is your TEST key.
  // Swap to your live pk_live_... key when you go live.
  STRIPE_PUBLISHABLE_KEY:
    "pk_test_51TfVRIKyfoKG2aQi7ByDHTU7JK1ToRmzd94LvyRFBHmtmGEvN6pYUBj8Xv1iNBlFq7vDjm3aWaW95Xdtr3giartg00udCYrO3V",

  // Free shipping kicks in at or above this subtotal (in cents). Display only;
  // the backend enforces the real rule.
  FREE_SHIPPING_THRESHOLD: 3500,
};
