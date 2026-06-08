// Burner Mason — homepage product grids.
// Cart + drawer behavior lives in ui.js (shared across pages).

(function () {
  const grids = {
    Lips: document.getElementById("grid-lips"),
    Hands: document.getElementById("grid-hands"),
  };

  // A small typographic "mark" stands in for a product photo (we have no labels).
  const initials = (name) => name.replace(/^Hand .*—\s*/, "").trim()[0] || name[0];

  function productCard(p) {
    const el = document.createElement("article");
    el.className = "card";
    const href = `product.html?sku=${encodeURIComponent(p.sku)}`;
    // Card data is from our own catalog (trusted), so templating is safe here.
    el.innerHTML = `
      <a class="card-link" href="${href}">
        <span class="mark">${initials(p.name)}</span>
        <h3>${p.name}</h3>
        <p class="blurb">${p.blurb}</p>
      </a>
      <div class="row">
        <span class="price">${bmMoney(p.price)}</span>
        <button class="btn" data-add="${p.sku}">Add</button>
      </div>`;
    return el;
  }

  (window.BM_CATALOG || []).forEach((p) => {
    const g = grids[p.group];
    if (g) g.appendChild(productCard(p));
  });
})();
