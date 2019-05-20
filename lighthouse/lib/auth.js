const { API_SECRET } = require("./env");

module.exports = fn => {
  return function(req, res) {
    const authorization = req.headers.authorization || "";
    const m = authorization.match(/^bearer\s+(\S+)\s*$/i);
    if (!m || m[1] !== API_SECRET) {
      res.statusCode = 403;
      res.end("forbidden");
      return;
    }

    return fn.call(this, req, res);
  };
};
