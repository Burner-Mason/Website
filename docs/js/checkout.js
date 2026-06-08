// Burner Mason — checkout flow.
// Steps: render summary -> collect address -> POST /rates -> pick rate -> POST /checkout -> Stripe.

(function () {
  const RATES_URL = window.BM_CONFIG.RATES_URL.replace(/\/$/, "");
  const CHECKOUT_URL = window.BM_CONFIG.CHECKOUT_URL.replace(/\/$/, "");
  const $ = (id) => document.getElementById(id);

  const form = $("address-form");
  const ratesBtn = $("rates-btn");
  const ratesSection = $("rates-section");
  const ratesList = $("rates-list");
  const ratesMsg = $("rates-msg");
  const payBtn = $("pay-btn");

  let selectedRate = null; // { id, amount, label }

  // ---- Order summary (trusted catalog data) ----
  function renderSummary() {
    const lines = BMCart.lines();
    if (!lines.length) {
      $("empty-state").hidden = false;
      form.hidden = true;
      $("summary-lines").innerHTML = "";
      $("summary-totals").innerHTML = "";
      return;
    }
    $("summary-lines").innerHTML = lines
      .map(
        (l) => `<div class="line">
          <span class="name">${l.name}${l.qty > 1 ? ` ×${l.qty}` : ""}</span>
          <span class="lt">${bmMoney(l.lineTotal)}</span>
        </div>`
      )
      .join("");
    renderTotals();
  }

  function renderTotals() {
    const subtotal = BMCart.subtotal();
    const ship = selectedRate ? selectedRate.amount : null;
    const rows = [`<div class="row"><span>Subtotal</span><span>${bmMoney(subtotal)}</span></div>`];
    rows.push(
      `<div class="row"><span>Shipping</span><span>${
        ship === null ? "—" : ship === 0 ? "Free" : bmMoney(ship)
      }</span></div>`
    );
    const grand = subtotal + (ship || 0);
    rows.push(`<div class="row grand"><span>Total</span><span>${bmMoney(grand)}</span></div>`);
    $("summary-totals").innerHTML = rows.join("");
  }

  // ---- Helpers ----
  function setMsg(text, isError) {
    ratesMsg.innerHTML = "";
    if (!text) return;
    const d = document.createElement("div");
    d.className = "msg" + (isError ? " err" : "");
    d.textContent = text; // textContent: never inject server/user strings as HTML
    ratesMsg.appendChild(d);
  }

  function readAddress() {
    const get = (id) => $(id).value.trim();
    return {
      name: get("name"),
      email: get("email"),
      line1: get("line1"),
      line2: get("line2"),
      city: get("city"),
      state: get("state"),
      zip: get("zip"),
      country: $("country").value,
    };
  }

  // ---- Step 1: get rates ----
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    selectedRate = null;
    payBtn.disabled = true;
    ratesSection.hidden = true;
    ratesBtn.disabled = true;
    ratesBtn.innerHTML = `<span class="spinner"></span> Getting rates…`;
    setMsg("");

    try {
      const res = await fetch(RATES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: BMCart.payload(), address: readAddress() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not fetch shipping rates.");
      if (!data.rates || !data.rates.length) throw new Error("No shipping rates available for that address.");
      renderRates(data.rates);
    } catch (err) {
      setMsg(err.message || "Something went wrong getting shipping rates.", true);
    } finally {
      ratesBtn.disabled = false;
      ratesBtn.textContent = "Refresh shipping options";
    }
  });

  // ---- Render rate choices (DOM nodes; external strings via textContent) ----
  function renderRates(rates) {
    ratesList.innerHTML = "";
    rates.forEach((rate, i) => {
      const label = document.createElement("label");
      label.className = "rate";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "shiprate";
      input.value = rate.id;

      const meta = document.createElement("div");
      meta.className = "meta";
      const svc = document.createElement("div");
      svc.className = "svc";
      svc.textContent = rate.label; // e.g. "USPS Priority Mail"
      const eta = document.createElement("div");
      eta.className = "eta";
      eta.textContent = rate.eta || "";
      meta.appendChild(svc);
      if (rate.eta) meta.appendChild(eta);

      const amt = document.createElement("span");
      amt.className = "amt";
      amt.textContent = rate.amount === 0 ? "Free" : bmMoney(rate.amount);

      label.append(input, meta, amt);

      input.addEventListener("change", () => {
        document.querySelectorAll(".rate").forEach((r) => r.classList.remove("sel"));
        label.classList.add("sel");
        selectedRate = { id: rate.id, amount: rate.amount, label: rate.label };
        payBtn.disabled = false;
        renderTotals();
      });

      ratesList.appendChild(label);

      if (i === 0) input.click(); // preselect the first/cheapest
    });

    ratesSection.hidden = false;
  }

  // ---- Step 2: create Stripe session & redirect ----
  payBtn.addEventListener("click", async () => {
    if (!selectedRate) return;
    payBtn.disabled = true;
    payBtn.innerHTML = `<span class="spinner"></span> Redirecting to payment…`;
    setMsg("");

    try {
      const res = await fetch(CHECKOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: BMCart.payload(),
          address: readAddress(),
          shippingRateId: selectedRate.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start checkout.");
      window.location.href = data.url; // Stripe-hosted payment page
    } catch (err) {
      setMsg(err.message || "Something went wrong starting checkout.", true);
      payBtn.disabled = false;
      payBtn.textContent = "Continue to payment";
    }
  });

  renderSummary();
})();
