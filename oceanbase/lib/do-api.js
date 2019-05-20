const fetch = require("node-fetch");

const BASE_URL = "https://api.digitalocean.com/v2";

module.exports = {
  getAccountInfo,
  listDatabaseClusters
};

async function getAccountInfo(token) {
  try {
    const response = await fetch(`${BASE_URL}/account`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      }
    });
    const { account } = await response.json();
    return account;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function listDatabaseClusters(token) {
  try {
    const response = await fetch(`${BASE_URL}/databases`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      }
    });
    const { databases } = await response.json();
    return databases;
  } catch (e) {
    throw new Error(e.message);
  }
}
