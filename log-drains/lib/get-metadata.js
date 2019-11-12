const fetch = require("node-fetch");
const { stringify } = require("querystring");
const responseError = require("./response-error");

module.exports = async ({ configurationId, teamId, token }) => {
  const query = stringify({ teamId });
  const res = await fetch(
    `https://api.zeit.co/v1/integrations/configuration/${encodeURIComponent(
      configurationId
    )}/metadata?${query}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const body = await res.json();
  if (!res.ok) {
    throw await responseError(res);
  }

  return body;
};
