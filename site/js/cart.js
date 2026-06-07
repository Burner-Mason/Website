// Burner Mason — cart state, persisted in localStorage.
// Shape: { [sku]: quantity }. Kept tiny on purpose.

const BM_CART_KEY = "bm_cart_v1";

const BMCart = {
  read() {
    try {
      return JSON.parse(localStorage.getItem(BM_CART_KEY)) || {};
    } catch {
      return {};
    }
  },

  write(cart) {
    localStorage.setItem(BM_CART_KEY, JSON.stringify(cart));
    document.dispatchEvent(new CustomEvent("bm:cart-changed"));
  },

  add(sku, qty = 1) {
    const cart = this.read();
    cart[sku] = (cart[sku] || 0) + qty;
    if (cart[sku] < 1) delete cart[sku];
    this.write(cart);
  },

  setQty(sku, qty) {
    const cart = this.read();
    if (qty < 1) delete cart[sku];
    else cart[sku] = qty;
    this.write(cart);
  },

  remove(sku) {
    const cart = this.read();
    delete cart[sku];
    this.write(cart);
  },

  clear() {
    localStorage.removeItem(BM_CART_KEY);
    document.dispatchEvent(new CustomEvent("bm:cart-changed"));
  },

  // Returns [{ ...product, qty, lineTotal }] joined with the catalog.
  lines() {
    const cart = this.read();
    const bySku = Object.fromEntries((window.BM_CATALOG || []).map((p) => [p.sku, p]));
    return Object.entries(cart)
      .filter(([sku]) => bySku[sku])
      .map(([sku, qty]) => ({ ...bySku[sku], qty, lineTotal: bySku[sku].price * qty }));
  },

  count() {
    return Object.values(this.read()).reduce((a, b) => a + b, 0);
  },

  subtotal() {
    return this.lines().reduce((a, l) => a + l.lineTotal, 0);
  },

  // Compact payload for the backend: just SKUs + quantities. The server
  // resolves prices itself — we never send money amounts it has to trust.
  payload() {
    return this.lines().map((l) => ({ sku: l.sku, qty: l.qty }));
  },
};

window.BMCart = BMCart;

// Small shared helper.
window.bmMoney = (cents) =>
  "$" + (cents / 100).toFixed(2).replace(/\.00$/, "");
