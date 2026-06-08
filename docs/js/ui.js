// Burner Mason — shared UI behavior (header cart button + cart drawer).
// Included on every page that has the cart drawer markup (index, about, product).
// Safe to include on pages without the drawer — it no-ops if the nodes are absent.

(function () {
  const drawer = document.getElementById("drawer");
  const countEl = document.getElementById("cart-count");

  // Keep the header count in sync even on pages without a drawer.
  function syncCount() {
    if (countEl) countEl.textContent = BMCart.count();
  }

  // ---- Add-to-cart (global delegation) ----
  // Product cards are wrapped in links, so prevent navigation when the Add
  // button itself is clicked. We never auto-open the cart — patrons browse and
  // open it on their own. Just a quiet "Added" confirmation.
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
    e.preventDefault(); // don't follow a surrounding product link
    BMCart.add(add.dataset.add, 1);
    flashAdded(add);
  });

  // ---- Cart drawer (only if present on this page) ----
  if (drawer) {
    const backdrop = document.getElementById("drawer-backdrop");
    const itemsEl = document.getElementById("cart-items");
    const footerEl = document.getElementById("cart-footer");
    const openBtn = document.getElementById("open-cart");
    const closeBtn = document.getElementById("close-cart");

    const open = () => {
      drawer.classList.add("open");
      backdrop.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
    };
    const close = () => {
      drawer.classList.remove("open");
      backdrop.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
    };

    if (openBtn) openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (backdrop) backdrop.addEventListener("click", close);
    document.addEventListener("keydown", (e) => e.key === "Escape" && close());

    function renderCart() {
      const lines = BMCart.lines();
      syncCount();

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
  } else {
    // No drawer on this page — still keep the count badge current.
    document.addEventListener("bm:cart-changed", syncCount);
    syncCount();
  }
})();
