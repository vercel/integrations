const fetchApi = require("./fetch-api");

module.exports = deployments => {
  const data = deployments.map(({ id, url, ownerId }) => ({
    id,
    url,
    ownerId
  }));
  return fetchApi("/lighthouse", data);
};
