const fetch = require("node-fetch");
const { stringify } = require("querystring");

module.exports = async ({
  accessToken,
  from,
  limit,
  projectId,
  since,
  teamId
}) => {
  const query = stringify({ from, limit, projectId, teamId });
  const res = await fetch(`https://api.zeit.co/v4/now/deployments?${query}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const body = await res.json();

  if (!res.ok) {
    const err = new Error(body.error.message || "Failed to fetch deployments");
    err.res = res;
    err.body = body;
    throw err;
  }

  let { deployments } = body;

  if (since) {
    deployments = deployments.filter(d => d.created >= since);
  }

  return deployments;
};
