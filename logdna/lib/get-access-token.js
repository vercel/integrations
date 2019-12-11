const fetch = require("node-fetch");
const { stringify } = require("querystring");
const { CLIENT_ID, CLIENT_SECRET } = require("./env");
const responseError = require("./response-error");

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

  if (!res.ok) {
    throw await responseError(res);
  }

  const body = await res.json();
  return body.access_token;
};
