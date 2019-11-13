const { parse } = require("url");
let routes;

module.exports = (arg, action, state = {}) => {
  if (!routes) {
    routes = {
      "list-drains": require("../ui"),
      "new-drain": require("../ui/new-drain"),
      "create-drain": require("../ui/create-drain"),
      "delete-drain": require("../ui/delete-drain")
    };
  }

  if (!action) {
    action = arg.payload.action;
  }

  const { pathname, query } = parse(action, true);
  for (const [p, fn] of Object.entries(routes)) {
    if (p === pathname) {
      return fn(arg, { params: query, state });
    }
  }
};
