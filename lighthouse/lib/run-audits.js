const fetchApi = require("./fetch-api");

module.exports = ({ id, url, ownerId }) => {
  // don't wait result
  return fetchApi("/lighthouse", {
    id,
    url,
    ownerId
  });
};
