// Burner Mason — product detail page. Renders from ?sku= against the catalog.
// All catalog text is injected via textContent (never innerHTML) — safe by default.

(function () {
  const params = new URLSearchParams(location.search);
  const sku = params.get("sku");
  const product = (window.BM_CATALOG || []).find((p) => p.sku === sku);

  const detail = document.getElementById("product-detail");
  const notfound = document.getElementById("product-notfound");

  if (!product) {
    if (detail) detail.hidden = true;
    if (notfound) notfound.hidden = false;
    document.title = "Not found — Burner Mason";
    return;
  }

  const initials = (name) => name.replace(/^Hand .*—\s*/, "").trim()[0] || name[0];
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  document.title = `${product.name} — Burner Mason`;
  set("p-mark", initials(product.name));
  set("p-group", product.group === "Lips" ? "For lips" : "For hands");
  set("p-name", product.name);
  set("p-price", bmMoney(product.price));
  set("p-desc", product.desc);
  set("p-detail", product.detail || "");

  // ui.js handles the clicks (add-to-cart and buy-now) via these data attributes.
  const addBtn = document.getElementById("p-add");
  if (addBtn) addBtn.setAttribute("data-add", product.sku);
  const buyBtn = document.getElementById("p-buy");
  if (buyBtn) buyBtn.setAttribute("data-buy", product.sku);
})();
