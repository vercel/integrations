const fetch = require("node-fetch");
const { API_SECRET, HOST } = require("./env");

module.exports = (path, params) => {
  const headers = {
    Authorization: `Bearer ${API_SECRET}`
  };
  if (params) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(`${HOST}${path}`, {
    method: "POST",
    headers,
    body: params ? JSON.stringify(params) : null
  });
};
