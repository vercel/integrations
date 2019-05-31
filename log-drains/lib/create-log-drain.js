const fetch = require("node-fetch");
const { stringify } = require("querystring");

module.exports = async ({ accessToken, name, teamId, type, url }) => {
  const query = stringify({ teamId });
  const res = await fetch(
    `https://api.zeit.co/v1/integrations/log-drains?${query}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ type, name, url })
    }
  );

  if (!res.ok) {
    const err = new Error("Failed to create log drain");
    err.res = res;
    err.body = await res.text();
    throw err;
  }

  return res.json();
};
