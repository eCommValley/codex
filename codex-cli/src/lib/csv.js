export function parseCsv(text) {
  const rows = [];
  let current = [];
  let value = "";
  let inQuotes = false;
  const input = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === "\"") {
      const next = input[index + 1];
      if (inQuotes && next === "\"") {
        value += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && char === ",") {
      current.push(value.trim());
      value = "";
      continue;
    }
    if (!inQuotes && char === "\n") {
      current.push(value.trim());
      rows.push(current);
      current = [];
      value = "";
      continue;
    }
    value += char;
  }
  if (value.length > 0 || current.length > 0) {
    current.push(value.trim());
    rows.push(current);
  }
  return rows.filter((row) => row.some((cell) => cell !== ""));
}
