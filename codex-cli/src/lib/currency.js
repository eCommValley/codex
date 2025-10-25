export function roundToCents(value) {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(value, currency) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
}

export function parseAmount(value) {
  if (typeof value === "number") {
    return value;
  }
  const normalized = String(value).replace(/[, ]/g, "");
  if (!/^[-+]?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Invalid amount: ${value}`);
  }
  return Number(normalized);
}
