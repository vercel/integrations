const { DATADOG_HOSTS } = require("./constants");

module.exports = hostname => {
  for (const [region, h] of Object.entries(DATADOG_HOSTS)) {
    if (hostname.endsWith(h)) {
      return region;
    }
  }
};
