export function parseIsoDate(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${input}`);
  }
  return date;
}

export function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function normalizePeriodInput(value) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function createDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

function endOfMonth(year, month) {
  return new Date(Date.UTC(year, month, 0));
}

export function resolvePeriod({ period, from, to }) {
  if (period) {
    return parsePeriod(period);
  }
  if (!from || !to) {
    throw new Error("Provide --period or both --from and --to.");
  }
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (start > end) {
    throw new Error("The start date must be before the end date.");
  }
  return { start, end };
}

export function parsePeriod(value) {
  const normalized = normalizePeriodInput(value);
  const quarterMatch = normalized.match(/^(Q([1-4]))-(\d{4})$/) || normalized.match(/^(\d{4})Q([1-4])$/);
  if (quarterMatch) {
    const year = Number(quarterMatch[3] || quarterMatch[1]);
    const quarter = Number(quarterMatch[2]);
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    return {
      start: createDate(year, startMonth, 1),
      end: endOfMonth(year, endMonth),
    };
  }
  const monthMatch = normalized.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    return {
      start: createDate(year, month, 1),
      end: endOfMonth(year, month),
    };
  }
  const compactMonthMatch = normalized.match(/^(\d{4})(0[1-9]|1[0-2])$/);
  if (compactMonthMatch) {
    const year = Number(compactMonthMatch[1]);
    const month = Number(compactMonthMatch[2]);
    return {
      start: createDate(year, month, 1),
      end: endOfMonth(year, month),
    };
  }
  const yearMatch = normalized.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    return {
      start: createDate(year, 1, 1),
      end: endOfMonth(year, 12),
    };
  }
  throw new Error(`Unsupported period format: ${value}`);
}

export function isDateWithin(date, { start, end }) {
  return date >= start && date <= end;
}

export function compareIsoDates(a, b) {
  return a.localeCompare(b);
}
