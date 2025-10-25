export function getChartOfAccounts(config) {
  return Array.isArray(config.chart_of_accounts) ? config.chart_of_accounts : [];
}

export function findAccount(config, code) {
  return getChartOfAccounts(config).find((account) => account.code === code);
}

export function requireAccount(config, code, message) {
  const account = findAccount(config, code);
  if (!account) {
    throw new Error(message || `Account ${code} is not defined in the chart of accounts.`);
  }
  return account;
}

export function getBankAccount(config) {
  const fromConfig = config.accounts?.bank_account_code;
  if (fromConfig) {
    const account = findAccount(config, fromConfig);
    if (!account) {
      throw new Error(`Configured bank account code ${fromConfig} is not in the chart of accounts.`);
    }
    return account;
  }
  const candidate = getChartOfAccounts(config).find((account) => account.role === "bank");
  if (!candidate) {
    throw new Error("No bank account configured. Update ledger.yml to set accounts.bank_account_code.");
  }
  return candidate;
}

export function getVatProfile(config) {
  const vatConfig = config.vat || {};
  return {
    profileId: vatConfig.profile_id || "default",
    rates: Array.isArray(vatConfig.rates) ? vatConfig.rates : [],
  };
}

export function findVatRate(config, rateId) {
  const profile = getVatProfile(config);
  return profile.rates.find((rate) => rate.id === rateId);
}

export function requireVatRate(config, rateId) {
  const rate = findVatRate(config, rateId);
  if (!rate) {
    const available = getVatProfile(config)
      .rates.map((rateItem) => rateItem.id)
      .join(", ");
    throw new Error(`Unknown VAT rate ${rateId}. Available: ${available || "none"}.`);
  }
  return rate;
}

export function isPeriodClosed(config, isoDate) {
  const closed = config.periods?.closed;
  if (!Array.isArray(closed)) {
    return false;
  }
  const target = new Date(isoDate);
  return closed.some((period) => {
    if (!period || !period.start || !period.end) {
      return false;
    }
    const start = new Date(period.start);
    const end = new Date(period.end);
    return target >= start && target <= end;
  });
}

export function recordClosedPeriod(config, { label, start, end }) {
  if (!config.periods) {
    config.periods = {};
  }
  if (!Array.isArray(config.periods.closed)) {
    config.periods.closed = [];
  }
  config.periods.closed.push({
    label,
    start,
    end,
  });
}

export function ensurePolicy(config, key, defaultValue) {
  if (!config.policies) {
    config.policies = {};
  }
  if (config.policies[key] === undefined) {
    config.policies[key] = defaultValue;
  }
  return config.policies[key];
}
