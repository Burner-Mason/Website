// Burner Mason — thin Shippo API client (uses global fetch, Node 18+).
// Docs: https://docs.goshippo.com/

const SHIPPO_BASE = "https://api.goshippo.com";

function token() {
  const t = process.env.SHIPPO_TOKEN;
  if (!t) throw new Error("SHIPPO_TOKEN is not set");
  return t;
}

async function shippo(path, body, method = "POST") {
  const res = await fetch(`${SHIPPO_BASE}${path}`, {
    method,
    headers: {
      Authorization: `ShippoToken ${token()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail || data?.__all__ || JSON.stringify(data);
    throw new Error(`Shippo ${method} ${path} failed: ${detail}`);
  }
  return data;
}

// The merchant's ship-from address, from env.
function originAddress() {
  return {
    name: process.env.BUSINESS_NAME || "Burner Mason",
    street1: process.env.BUSINESS_STREET1 || "",
    street2: process.env.BUSINESS_STREET2 || "",
    city: process.env.BUSINESS_CITY || "",
    state: process.env.BUSINESS_STATE || "",
    zip: process.env.BUSINESS_ZIP || "",
    country: process.env.BUSINESS_COUNTRY || "US",
    phone: process.env.BUSINESS_PHONE || "",
    email: process.env.BUSINESS_EMAIL || "",
  };
}

// Map a patron address (our checkout shape) into Shippo's shape.
function toAddress(a) {
  return {
    name: a.name,
    street1: a.line1,
    street2: a.line2 || "",
    city: a.city,
    state: a.state,
    zip: a.zip,
    country: a.country || "US",
    email: a.email || "",
  };
}

// Create a shipment and return its rates (synchronously).
async function getRates(patronAddress, parcel) {
  const shipment = await shippo("/shipments/", {
    address_from: originAddress(),
    address_to: toAddress(patronAddress),
    parcels: [parcel],
    async: false,
  });
  return shipment.rates || [];
}

async function getRateById(rateId) {
  return shippo(`/rates/${encodeURIComponent(rateId)}`, null, "GET");
}

// Buy a label for a given rate object id.
async function buyLabel(rateId, metadata) {
  return shippo("/transactions/", {
    rate: rateId,
    label_file_type: "PDF",
    metadata: metadata || "",
    async: false,
  });
}

function cents(rate) {
  return Math.round(parseFloat(rate.amount) * 100);
}

function rateLabel(rate) {
  const svc = rate.servicelevel?.name || rate.servicelevel?.token || "Shipping";
  return `${rate.provider} ${svc}`.trim();
}

function rateEta(rate) {
  if (rate.estimated_days) {
    return `~${rate.estimated_days} day${rate.estimated_days > 1 ? "s" : ""}`;
  }
  return rate.duration_terms || "";
}

module.exports = {
  getRates,
  getRateById,
  buyLabel,
  cents,
  rateLabel,
  rateEta,
  originAddress,
};
