const fetch = require("node-fetch");
const { stringify } = require("querystring");

module.exports = async ({ accessToken, from, limit }) => {
  const query = stringify({ from, limit });
  const res = await fetch(`https://api.zeit.co/v1/projects/list?${query}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const body = await res.json();

  if (!res.ok) {
    const err = new Error(body.error.message || "Failed to fetch projects");
    err.res = res;
    err.body = body;
    throw err;
  }

  return body;
};
