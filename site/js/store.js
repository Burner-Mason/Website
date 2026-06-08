// Burner Mason — storefront rendering + cart drawer.

(function () {
  const grids = {
    Lips: document.getElementById("grid-lips"),
    Hands: document.getElementById("grid-hands"),
  };

  // A tiny typographic "mark" instead of a product photo (we have no labels).
  const initials = (name) =>
    name.replace(/^Lip Balm.*—\s*/, "").replace(/^Hand .*—\s*/, "").trim()[0] || name[0];

  function productCard(p) {
    const el = document.createElement("article");
    el.className = "card";
    el.innerHTML = `
      <div class="mark">${initials(p.name)}</div>
      <h3>${p.name}</h3>
      <p class="blurb">${p.blurb}</p>
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

  // --- Cart drawer wiring ---
  const drawer = document.getElementById("drawer");
  const backdrop = document.getElementById("drawer-backdrop");
  const itemsEl = document.getElementById("cart-items");
  const footerEl = document.getElementById("cart-footer");
  const countEl = document.getElementById("cart-count");

  function openDrawer() {
    drawer.classList.add("open");
    backdrop.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  }

  document.getElementById("open-cart").addEventListener("click", openDrawer);
  document.getElementById("close-cart").addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeDrawer());

  // Add-to-cart (event delegation). We deliberately do NOT open the cart — let
  // people browse and pick at their own pace. Just a quiet confirmation on the button.
  function flashAdded(btn) {
    if (btn.dataset.flashing) return;
    const original = btn.dataset.label || btn.textContent;
    btn.dataset.label = original;
    btn.dataset.flashing = "1";
    btn.textContent = "Added";
    setTimeout(() => {
      btn.textContent = original;
      delete btn.dataset.flashing;
    }, 1100);
  }

  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (!add) return;
    BMCart.add(add.dataset.add, 1);
    flashAdded(add);
  });

  function renderCart() {
    const lines = BMCart.lines();
    const count = BMCart.count();
    countEl.textContent = count;

    if (!lines.length) {
      itemsEl.innerHTML = `<p class="empty">Your cart is empty.</p>`;
      footerEl.innerHTML = "";
      return;
    }

    itemsEl.innerHTML = lines
      .map(
        (l) => `
      <div class="line">
        <span class="name">${l.name}</span>
        <span class="lt">${bmMoney(l.lineTotal)}</span>
        <div class="qty">
          <button data-dec="${l.sku}" aria-label="Decrease">−</button>
          <span>${l.qty}</span>
          <button data-inc="${l.sku}" aria-label="Increase">+</button>
        </div>
        <button class="rm" data-rm="${l.sku}">Remove</button>
      </div>`
      )
      .join("");

    const subtotal = BMCart.subtotal();
    const threshold = window.BM_CONFIG.FREE_SHIPPING_THRESHOLD;
    const met = subtotal >= threshold;
    const remaining = threshold - subtotal;

    footerEl.innerHTML = `
      <div class="subtotal">
        <span>Subtotal</span>
        <span class="amt">${bmMoney(subtotal)}</span>
      </div>
      <p class="ship-hint ${met ? "met" : ""}">
        ${met ? "You've got free shipping." : `Add ${bmMoney(remaining)} more for free shipping.`}
      </p>
      <a class="btn block" href="checkout.html">Checkout</a>`;
  }

  // Quantity / remove controls (delegated, only inside the drawer).
  itemsEl.addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    const rm = e.target.closest("[data-rm]");
    if (inc) BMCart.add(inc.dataset.inc, 1);
    if (dec) BMCart.add(dec.dataset.dec, -1);
    if (rm) BMCart.remove(rm.dataset.rm);
  });

  document.addEventListener("bm:cart-changed", renderCart);
  renderCart();
})();
