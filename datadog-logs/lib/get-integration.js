const fetch = require("node-fetch");
const { stringify } = require("querystring");
const responseError = require("./response-error");

module.exports = async ({ token, teamId }, { id }) => {
  const query = stringify({ teamId });
  const res = await fetch(
    `https://api.zeit.co/v1/integrations/integration/${encodeURIComponent(
      id
    )}?${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!res.ok) {
    throw await responseError(res);
  }

  return res.json();
};
