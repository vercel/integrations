const getRawBody = require("raw-body");

module.exports = async (req, res) => {
  const body = await getRawBody(req);
  let logs;

  try {
    logs = JSON.parse(body);
  } catch (err) {
    console.error(err);
  }

  console.log(`drained ${logs.length} logs`);
  res.end("ok");
};
