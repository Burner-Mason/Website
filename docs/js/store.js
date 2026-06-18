// Burner Mason — homepage product grids.
// Cart + drawer behavior lives in ui.js (shared across pages).

(function () {
  const grids = {
    Lips: document.getElementById("grid-lips"),
    Hands: document.getElementById("grid-hands"),
  };

  // Typographic "mark" used as a fallback when a product has no photo.
  const initials = (name) => name.replace(/^Hand .*—\s*/, "").trim()[0] || name[0];

  function productCard(p) {
    const el = document.createElement("article");
    el.className = "card";
    const href = `product.html?sku=${encodeURIComponent(p.sku)}`;

    // Media: a product photo when we have one, else the typographic mark.
    const link = document.createElement("a");
    link.className = "card-link";
    link.href = href;
    const media = document.createElement("span");
    media.className = "card-media";
    if (p.image) {
      media.appendChild(window.bmProductImage(p, "card", false));
    } else if (p.comingSoon) {
      media.classList.add("is-soon");
      media.appendChild(window.bmComingSoon(p, false));
    } else {
      media.classList.add("is-mark");
      const mark = document.createElement("span");
      mark.className = "mark";
      mark.textContent = initials(p.name);
      media.appendChild(mark);
    }
    // Card data is from our own catalog (trusted), so templating is safe here.
    link.innerHTML = `<h3>${p.name}</h3><p class="blurb">${p.blurb}</p>`;
    link.prepend(media);

    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<span class="price">${bmMoney(p.price)}</span>
      <button class="btn" data-add="${p.sku}">Add</button>`;

    el.append(link, row);
    return el;
  }

  (window.BM_CATALOG || []).forEach((p) => {
    const g = grids[p.group];
    if (g) g.appendChild(productCard(p));
  });
})();
