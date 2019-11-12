module.exports = {
  GET: {
    "/drains": require("../ui"),
    "/drains/new": require("../ui/new-drain")
  },
  POST: {
    "/drains": require("../ui/create-drain")
  },
  DELETE: {
    "/drains/:drainId": require("../ui/delete-drain")
  }
};
