const fetch = require("node-fetch");
const { stringify } = require("querystring");
const responseError = require("./response-error");

module.exports = async ({ token, teamId }, { name, projectId, type, url }) => {
  const query = stringify({ teamId });
  const res = await fetch(
    `https://api.zeit.co/v1/integrations/log-drains?${query}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, projectId, type, url })
    }
  );

  if (!res.ok) {
    throw await responseError(res);
  }

  return res.json();
};
