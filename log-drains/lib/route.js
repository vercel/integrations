const { match } = require("path-to-regexp");

let routes;

module.exports = (arg, action, state = {}) => {
  if (!routes) {
    const ROUTES = {
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

    routes = {};
    for (const [method, route] of Object.entries(ROUTES)) {
      routes[method] = Object.entries(route).map(([p, m]) => [match(p), m]);
    };
  }

  if (!action) {
    action = arg.payload.action;
  }

  const [method, path] = action.split(' ');
  for (const [m, fn] of routes[method]) {
    const params = m(path);
    if (params) {
      return fn(arg, { ...params, method, state });
    }
  }
};
