function toCamelCase(input) {
  return input.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function coerceValue(value) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return value;
}

export function parseArgv(argv) {
  const positional = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--") {
      positional.push(...argv.slice(index + 1));
      break;
    }
    if (token.startsWith("--")) {
      const nameWithMaybeValue = token.slice(2);
      if (nameWithMaybeValue.length === 0) {
        positional.push(token);
        continue;
      }
      const [name, ...rest] = nameWithMaybeValue.split("=");
      const optionName = toCamelCase(name);
      if (rest.length > 0) {
        options[optionName] = coerceValue(rest.join("="));
        continue;
      }
      const next = argv[index + 1];
      if (next && !next.startsWith("-")) {
        options[optionName] = coerceValue(next);
        index += 1;
      } else {
        options[optionName] = true;
      }
      continue;
    }
    if (token.startsWith("-") && token.length > 1) {
      const flags = token.slice(1).split("");
      for (const flag of flags) {
        options[flag] = true;
      }
      continue;
    }
    positional.push(token);
  }
  return { positional, options };
}
