const fetch = require("node-fetch");
const { stringify } = require("querystring");

module.exports = async ({ accessToken, teamId, webhookUrl }) => {
  const query = stringify({ teamId });
  const res = await fetch(`https://api.zeit.co/v1/integrations/webhooks?${query}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Lighthouse Integration New Deployment',
      url: webhookUrl,
      events: ['deployment-ready']
    })
  });

  if (!res.ok) {
    const err = new Error("Failed to create webhook");
    err.res = res;
    err.body = await res.text();
    err.headers = [...res.headers.entries()];
    throw err;
  }

  return res.json();
};
