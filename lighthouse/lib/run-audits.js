const fetchApi = require("./fetch-api");

module.exports = ({ id, url, ownerId }) => {
  // don't wait result
  fetchApi("/lighthouse", {
    id,
    url,
    ownerId
  }).catch(console.error);
};
