const fetch = require("node-fetch");
const { stringify } = require("querystring");
const { CLIENT_ID, CLIENT_SECRET } = require("./env");

module.exports = async ({ code, redirectUri }) => {
  const res = await fetch("https://api.zeit.co/v2/oauth/access_token", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    method: "POST",
    body: stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: redirectUri
    })
  });

  const body = await res.json();

  if (!res.ok) {
    const err = new Error(
      body.error_description || "Failed to fetch accessToken"
    );
    err.res = res;
    err.body = body;
    throw err;
  }

  return body.access_token;
};
