const map = {
  IN: "INR",
  IND: "INR",
  INR: "INR",
  US: "USD",
  "US-EN": "USD",
  GB: "GBP",
  UK: "GBP",
  EU: "EUR",
};

module.exports = function localeToCurrency(key) {
  if (!key) return null;
  return map[key.toUpperCase()] || null;
};
