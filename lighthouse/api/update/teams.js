const auth = require("../../lib/auth");
const mongo = require("../../lib/mongo");
const update = require("../../lib/update");

module.exports = mongo.withClose(
  auth(async (req, res) => {
    if (typeof req.body !== "undefined" && typeof req.body !== "object") {
      res.statusCode = 400;
      res.end("Invalid body");
      return;
    }

    await update("teams", req.body);
    res.end("ok");
  })
);
