const fetch = require("node-fetch");
const { stringify } = require("querystring");

module.exports = async ({ accessToken, teamId }) => {
  const query = stringify({ teamId });
  const res = await fetch(
    `https://api.zeit.co/v1/integrations/log-drains?${query}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok) {
    const err = new Error("Failed to fetch log drains");
    err.res = res;
    err.body = await res.text();
    throw err;
  }

  return res.json();
};
