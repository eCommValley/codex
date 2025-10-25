const SPACE = " ";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function formatScalar(value) {
  if (value === null) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : JSON.stringify(value);
  }
  if (typeof value === "string") {
    if (value === "") {
      return "";
    }
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return JSON.stringify(value);
    }
    if (/^[A-Za-z0-9_@\-\.\/ ]+$/.test(value)) {
      return value;
    }
    return JSON.stringify(value);
  }
  return JSON.stringify(value);
}

function indentString(level) {
  return SPACE.repeat(level);
}

function stringifyInternal(value, indent) {
  const prefix = indentString(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${prefix}[]`;
    }
    return value
      .map((item) => {
        if (isPlainObject(item) || Array.isArray(item)) {
          const nested = stringifyInternal(item, indent + 2);
          return `${prefix}-\n${nested}`;
        }
        return `${prefix}- ${formatScalar(item)}`;
      })
      .join("\n");
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return `${prefix}{}`;
    }
    return entries
      .map(([key, val]) => {
        if (isPlainObject(val) || Array.isArray(val)) {
          const nested = stringifyInternal(val, indent + 2);
          return `${prefix}${key}:\n${nested}`;
        }
        return `${prefix}${key}: ${formatScalar(val)}`;
      })
      .join("\n");
  }
  return `${prefix}${formatScalar(value)}`;
}

export function stringifyYaml(value) {
  return stringifyInternal(value, 0);
}

function parseScalar(token) {
  if (token === "null") {
    return null;
  }
  if (token === "true") {
    return true;
  }
  if (token === "false") {
    return false;
  }
  if ((token.startsWith("\"") && token.endsWith("\"")) || (token.startsWith("'") && token.endsWith("'"))) {
    try {
      return JSON.parse(token.replace(/'/g, "\""));
    } catch {
      return token.slice(1, -1);
    }
  }
  if (/^-?\d+(\.\d+)?$/.test(token)) {
    return Number(token);
  }
  return token;
}

function countIndent(line) {
  let count = 0;
  while (count < line.length && line[count] === SPACE) {
    count += 1;
  }
  return count;
}

function nextNonEmpty(lines, start) {
  let index = start;
  while (index < lines.length) {
    const trimmed = lines[index].trim();
    if (trimmed !== "") {
      return { index, trimmed, indent: countIndent(lines[index]) };
    }
    index += 1;
  }
  return { index: lines.length, trimmed: "", indent: 0 };
}

function parseBlock(lines, start, indent) {
  const items = [];
  let index = start;
  while (index < lines.length) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      index += 1;
      continue;
    }
    const currentIndent = countIndent(rawLine);
    if (currentIndent < indent) {
      break;
    }
    if (trimmed.startsWith("-")) {
      const { value, nextIndex } = parseArray(lines, index, indent);
      items.push({ type: "array", value });
      index = nextIndex;
      continue;
    }
    const { value, nextIndex } = parseObject(lines, index, indent);
    items.push({ type: "object", value });
    index = nextIndex;
  }
  return { items, nextIndex: index };
}

function parseObject(lines, start, indent) {
  const obj = {};
  let index = start;
  while (index < lines.length) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      index += 1;
      continue;
    }
    const currentIndent = countIndent(rawLine);
    if (currentIndent < indent) {
      break;
    }
    if (trimmed.startsWith("-")) {
      break;
    }
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) {
      throw new Error(`Invalid YAML line: ${rawLine}`);
    }
    const key = trimmed.slice(0, colonIndex).trim();
    let remainder = trimmed.slice(colonIndex + 1).trim();
    if (remainder === "") {
      const { index: nextIndex, trimmed: nextTrimmed, indent: nextIndent } = nextNonEmpty(lines, index + 1);
      if (nextIndex >= lines.length || nextIndent <= currentIndent) {
        obj[key] = {};
        index = nextIndex;
        continue;
      }
      if (nextTrimmed === "[]") {
        obj[key] = [];
        index = nextIndex + 1;
        continue;
      }
      if (nextTrimmed === "{}") {
        obj[key] = {};
        index = nextIndex + 1;
        continue;
      }
      if (nextTrimmed.startsWith("-")) {
        const { value, nextIndex: afterArray } = parseArray(lines, nextIndex, currentIndent + 2);
        obj[key] = value;
        index = afterArray;
        continue;
      }
      const { value, nextIndex: afterObject } = parseObject(lines, nextIndex, currentIndent + 2);
      obj[key] = value;
      index = afterObject;
      continue;
    }
    obj[key] = parseScalar(remainder);
    index += 1;
  }
  return { value: obj, nextIndex: index };
}

function parseArray(lines, start, indent) {
  const result = [];
  let index = start;
  while (index < lines.length) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      index += 1;
      continue;
    }
    const currentIndent = countIndent(rawLine);
    if (currentIndent < indent) {
      break;
    }
    if (!trimmed.startsWith("-")) {
      break;
    }
    let valueToken = trimmed.slice(1).trim();
    if (valueToken === "") {
      const { index: nextIndex, trimmed: nextTrimmed, indent: nextIndent } = nextNonEmpty(lines, index + 1);
      if (nextIndex >= lines.length || nextIndent <= currentIndent) {
        result.push({});
        index = nextIndex;
        continue;
      }
      if (nextTrimmed.startsWith("-")) {
        const { value, nextIndex: afterArray } = parseArray(lines, nextIndex, currentIndent + 2);
        result.push(value);
        index = afterArray;
        continue;
      }
      const { value, nextIndex: afterObject } = parseObject(lines, nextIndex, currentIndent + 2);
      result.push(value);
      index = afterObject;
      continue;
    }
    if (valueToken.startsWith("-")) {
      // nested array starting immediately after hyphen
      const { value, nextIndex: afterNestedArray } = parseArray(lines, index, currentIndent + 2);
      result.push(value);
      index = afterNestedArray;
      continue;
    }
    result.push(parseScalar(valueToken));
    index += 1;
  }
  return { value: result, nextIndex: index };
}

export function parseYaml(text) {
  const lines = text.split(/\r?\n/);
  const { items } = parseBlock(lines, 0, 0);
  if (items.length === 0) {
    return {};
  }
  if (items.length === 1) {
    return items[0].value;
  }
  // Merge multiple top-level objects (should not happen, but we support sequential key blocks)
  return items.reduce((acc, item) => {
    if (Array.isArray(item.value)) {
      throw new Error("Top-level arrays are not supported in ledger configuration");
    }
    return { ...acc, ...item.value };
  }, {});
}
