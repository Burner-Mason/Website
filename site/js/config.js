// Burner Mason — front-end configuration.
// This file ships to the browser, so it must contain ONLY public values.
// NEVER put your Stripe secret key (sk_...) or Shippo token here.

window.BM_CONFIG = {
  // Your Cloud Run service URL. After you deploy the backend, paste it here.
  // Example: "https://burner-mason-api-xxxxxxxx-uc.a.run.app"
  // For local testing it defaults to http://localhost:8080.
  API_BASE: "http://localhost:8080",

  // Stripe PUBLISHABLE key (safe to expose). This is your TEST key.
  // Swap to your live pk_live_... key when you go live.
  STRIPE_PUBLISHABLE_KEY:
    "pk_test_51TfVRIKyfoKG2aQi7ByDHTU7JK1ToRmzd94LvyRFBHmtmGEvN6pYUBj8Xv1iNBlFq7vDjm3aWaW95Xdtr3giartg00udCYrO3V",

  // Free shipping kicks in at or above this subtotal (in cents). Display only;
  // the backend enforces the real rule.
  FREE_SHIPPING_THRESHOLD: 3500,
};
