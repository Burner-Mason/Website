// Burner Mason — on-site checkout.
// Two paths:
//   EXPRESS (top): Apple Pay / Google Pay lead. The wallet supplies the shipping
//     address; we compute live Shippo rates in the wallet sheet (deferred intent).
//   MANUAL (below): address form -> live rates -> card (Payment Element).

(function () {
  const RATES_URL = window.BM_CONFIG.RATES_URL.replace(/\/$/, "");
  const CHECKOUT_URL = window.BM_CONFIG.CHECKOUT_URL.replace(/\/$/, "");
  const JSON_H = { "Content-Type": "application/json" };
  const $ = (id) => document.getElementById(id);

  let stripe = null;
  const getStripe = () => (stripe = stripe || Stripe(window.BM_CONFIG.STRIPE_PUBLISHABLE_KEY));

  // manual (card) flow state
  let selectedRate = null;
  let elements = null;
  let paymentEl = null;
  let paying = false;
  // express (wallet) flow state
  let exElements = null;
  let exEl = null;
  let exRates = [];
  let exRateId = null;

  function appearance() {
    const root = document.documentElement.getAttribute("data-theme");
    const dark = root === "dark" || (!root && window.matchMedia("(prefers-color-scheme: dark)").matches);
    return { theme: dark ? "night" : "stripe" };
  }

  // ---- Order summary (trusted catalog data) ----
  function renderSummary() {
    const lines = BMCart.lines();
    if (!lines.length) {
      $("empty-state").hidden = false;
      $("address-form").hidden = true;
      $("summary-lines").innerHTML = "";
      $("summary-totals").innerHTML = "";
      return false;
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
    return true;
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
    rows.push(`<div class="row grand"><span>Total</span><span>${bmMoney(subtotal + (ship || 0))}</span></div>`);
    $("summary-totals").innerHTML = rows.join("");
  }

  function msgInto(boxId, text, isError) {
    const box = $(boxId);
    box.innerHTML = "";
    if (!text) return;
    const d = document.createElement("div");
    d.className = "msg" + (isError ? " err" : "");
    d.textContent = text;
    box.appendChild(d);
  }
  const setMsg = (t, e) => msgInto("rates-msg", t, e);
  const payMsg = (t, e) => msgInto("payment-msg", t, e);
  const exMsg = (t, e) => msgInto("express-msg", t, e);

  function readAddress() {
    const get = (id) => $(id).value.trim();
    return {
      name: get("name"), email: get("email"), line1: get("line1"), line2: get("line2"),
      city: get("city"), state: get("state"), zip: get("zip"), country: $("country").value,
    };
  }

  async function fetchRates(address) {
    const res = await fetch(RATES_URL, { method: "POST", headers: JSON_H, body: JSON.stringify({ items: BMCart.payload(), address }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not fetch shipping rates.");
    return data.rates || [];
  }

  // =================== EXPRESS (wallet-first) ===================
  function lineItems() {
    return BMCart.lines().map((l) => ({ name: `${l.name}${l.qty > 1 ? ` ×${l.qty}` : ""}`, amount: l.lineTotal }));
  }

  function initExpress() {
    exElements = getStripe().elements({ mode: "payment", amount: BMCart.subtotal(), currency: "usd", appearance: appearance() });
    exEl = exElements.create("expressCheckout", {
      paymentMethods: { applePay: "always", googlePay: "always" },
      shippingAddressRequired: true,
      emailRequired: true,
      phoneNumberRequired: true,
      allowedShippingCountries: ["US"],
      shippingRates: [{ id: "pending", displayName: "Calculated next", amount: 0 }],
      lineItems: lineItems(),
    });
    exEl.on("ready", (ev) => {
      const has = ev && ev.availablePaymentMethods && Object.keys(ev.availablePaymentMethods).length > 0;
      $("express-top").hidden = !has;
    });
    exEl.on("loaderror", (ev) => exDebug("wallet load error: " + ((ev && ev.error && ev.error.message) || "unknown")));
    exEl.on("shippingaddresschange", onExShippingAddress);
    exEl.on("shippingratechange", onExShippingRate);
    exEl.on("cancel", () => exElements.update({ amount: BMCart.subtotal() }));
    exEl.on("confirm", onExConfirm);
    exEl.mount("#express-top-element");
  }

  // The Apple Pay / Google Pay sheet is a NATIVE modal — we can't read a phone's
  // console — so surface each step's timing on the page. Also: Apple aborts a
  // shipping update that isn't answered within ~30s, so we cap our own wait well
  // under that and fail fast (with a visible reason) instead of freezing the sheet.
  const now = () => (window.performance && performance.now ? performance.now() : Date.now());
  function exDebug(msg) {
    try {
      const el = $("express-debug");
      if (el) el.textContent = msg;
      if (window.console) console.log("[wallet] " + msg);
    } catch (e) {}
  }
  function withTimeout(promise, ms, label) {
    let t;
    const guard = new Promise((_, reject) => {
      t = setTimeout(() => reject(new Error((label || "request") + " timed out after " + ms + "ms")), ms);
    });
    return Promise.race([promise, guard]).finally(() => clearTimeout(t));
  }

  async function onExShippingAddress(event) {
    const t0 = now();
    exDebug("getting shipping rates…");
    try {
      const a = event.address || {};
      // Wallet redacts to city/state/postal — enough to rate. Placeholder name/line1
      // (rates are computed from the ZIP; the real address is captured at confirm).
      const rates = await withTimeout(fetchRates({
        name: "Customer", line1: "—",
        city: a.city, state: a.state,
        zip: a.postal_code || a.postalCode || a.zip || "",
        country: a.country || "US",
      }), 12000, "shipping rates");
      const ms = Math.round(now() - t0);
      if (!rates.length) { exDebug("no rates for that address (" + ms + "ms)"); return event.reject(); }
      exRates = rates;
      exRateId = rates[0].id;
      exElements.update({ amount: BMCart.subtotal() + rates[0].amount });
      event.resolve({ shippingRates: rates.map((r) => ({ id: r.id, displayName: r.label, amount: r.amount })) });
      exDebug("shipping rates ready in " + ms + "ms");
    } catch (e) {
      const ms = Math.round(now() - t0);
      exDebug("rate lookup failed after " + ms + "ms: " + ((e && e.message) || e));
      event.reject();
    }
  }

  function onExShippingRate(event) {
    const r = exRates.find((x) => x.id === event.shippingRate.id);
    if (!r) return event.reject();
    exRateId = r.id;
    exElements.update({ amount: BMCart.subtotal() + r.amount });
    event.resolve();
  }

  async function onExConfirm(event) {
    try {
      const { error: submitError } = await exElements.submit();
      if (submitError) return exMsg(submitError.message, true);

      const sa = event.shippingAddress || {};
      const aa = sa.address || {};
      const address = {
        name: sa.name || (event.billingDetails && event.billingDetails.name) || "Customer",
        email: (event.billingDetails && event.billingDetails.email) || "",
        line1: aa.line1 || "—",
        line2: aa.line2 || "",
        city: aa.city, state: aa.state, zip: aa.postal_code, country: aa.country || "US",
      };
      const res = await fetch(CHECKOUT_URL, {
        method: "POST", headers: JSON_H,
        body: JSON.stringify({ items: BMCart.payload(), address, shippingRateId: exRateId }),
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) throw new Error(data.error || "Could not start payment.");

      const { error } = await getStripe().confirmPayment({
        elements: exElements,
        clientSecret: data.clientSecret,
        confirmParams: { return_url: location.origin + "/success.html" },
        redirect: "if_required",
      });
      if (error) return exMsg(error.message || "Payment failed. Please try again.", true);
      window.location.href = "success.html";
    } catch (e) {
      exMsg(e.message || "Payment failed. Please try again.", true);
    }
  }

  // =================== MANUAL (address + card) ===================
  function resetPayment() {
    if (elements) {
      try { if (paymentEl) paymentEl.unmount(); } catch (e) {}
    }
    elements = paymentEl = null;
    paying = false;
    $("payment-section").hidden = true;
    payMsg("");
    $("pay-btn").hidden = false;
    $("pay-btn").disabled = !selectedRate;
    $("pay-btn").textContent = "Continue to payment";
  }

  $("address-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = $("address-form");
    if (!form.reportValidity()) return;
    selectedRate = null;
    $("rates-section").hidden = true;
    resetPayment();
    const ratesBtn = $("rates-btn");
    ratesBtn.disabled = true;
    ratesBtn.innerHTML = `<span class="spinner"></span> Getting rates…`;
    setMsg("");
    try {
      const rates = await fetchRates(readAddress());
      if (!rates.length) throw new Error("No shipping rates available for that address.");
      renderRates(rates);
    } catch (err) {
      setMsg(err.message || "Something went wrong getting shipping rates.", true);
    } finally {
      ratesBtn.disabled = false;
      ratesBtn.textContent = "Refresh shipping options";
    }
  });

  function renderRates(rates) {
    const list = $("rates-list");
    list.innerHTML = "";
    rates.forEach((rate, i) => {
      const label = document.createElement("label");
      label.className = "rate";
      const input = document.createElement("input");
      input.type = "radio"; input.name = "shiprate"; input.value = rate.id;
      const meta = document.createElement("div");
      meta.className = "meta";
      const svc = document.createElement("div"); svc.className = "svc"; svc.textContent = rate.label;
      meta.appendChild(svc);
      if (rate.eta) { const eta = document.createElement("div"); eta.className = "eta"; eta.textContent = rate.eta; meta.appendChild(eta); }
      const amt = document.createElement("span"); amt.className = "amt"; amt.textContent = rate.amount === 0 ? "Free" : bmMoney(rate.amount);
      label.append(input, meta, amt);
      input.addEventListener("change", () => {
        document.querySelectorAll(".rate").forEach((r) => r.classList.remove("sel"));
        label.classList.add("sel");
        selectedRate = { id: rate.id, amount: rate.amount, label: rate.label };
        renderTotals();
        resetPayment();
      });
      list.appendChild(label);
      if (i === 0) input.click();
    });
    $("rates-section").hidden = false;
  }

  $("pay-btn").addEventListener("click", async () => {
    if (!selectedRate) return;
    const payBtn = $("pay-btn");
    payBtn.disabled = true;
    payBtn.innerHTML = `<span class="spinner"></span> Loading payment…`;
    setMsg("");
    try {
      const res = await fetch(CHECKOUT_URL, {
        method: "POST", headers: JSON_H,
        body: JSON.stringify({ items: BMCart.payload(), address: readAddress(), shippingRateId: selectedRate.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) throw new Error(data.error || "Could not start payment.");
      await mountCard(data.clientSecret, data.amount);
      payBtn.hidden = true;
    } catch (err) {
      setMsg(err.message || "Something went wrong starting payment.", true);
      payBtn.disabled = false;
      payBtn.textContent = "Continue to payment";
    }
  });

  async function mountCard(clientSecret, amount) {
    elements = getStripe().elements({ clientSecret, appearance: appearance() });
    paymentEl = elements.create("payment", { layout: "tabs" });
    paymentEl.mount("#payment-element");
    const submit = $("submit-payment");
    submit.disabled = false;
    submit.textContent = amount != null ? `Pay ${bmMoney(amount)}` : "Pay";
    submit.onclick = () => confirmCard();
    $("payment-section").hidden = false;
    $("payment-section").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function confirmCard() {
    if (paying || !elements) return;
    paying = true;
    const submit = $("submit-payment");
    submit.disabled = true;
    submit.innerHTML = `<span class="spinner"></span> Processing…`;
    payMsg("");
    const { error, paymentIntent } = await getStripe().confirmPayment({
      elements,
      confirmParams: { return_url: location.origin + "/success.html" },
      redirect: "if_required",
    });
    if (error) {
      payMsg(error.message || "Payment failed. Please try another method.", true);
      submit.disabled = false; submit.textContent = "Pay"; paying = false;
      return;
    }
    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      window.location.href = "success.html";
      return;
    }
    payMsg("Payment couldn't be completed (" + (paymentIntent ? paymentIntent.status : "unknown") + ").", true);
    submit.disabled = false; submit.textContent = "Pay"; paying = false;
  }

  // Pre-warm the Cloud Run functions on page load so a cold start doesn't
  // freeze the Apple Pay / Google Pay sheet while it waits for live shipping
  // rates (and then the PaymentIntent). Fire-and-forget; no-cors so the GET
  // (which the functions answer 405 to) never trips CORS — the point is only
  // to spin the instances up before the wallet flow needs them.
  function warmBackends() {
    [RATES_URL, CHECKOUT_URL].forEach((url) => {
      try { fetch(url, { method: "GET", mode: "no-cors", cache: "no-store" }).catch(() => {}); } catch (e) {}
    });
  }

  // ---- init ----
  if (renderSummary()) {
    warmBackends();
    try { initExpress(); } catch (e) { /* wallets unavailable — manual flow still works */ }
  }
})();
