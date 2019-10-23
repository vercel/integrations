const getRawBody = require("raw-body");

module.exports = async (req, res) => {
  const body = await getRawBody(req);
  let logs;

  try {
    logs = JSON.parse(body);
  } catch (err) {
    console.error(err);
    res.statusCode = 400;
    res.end(err.message);
    return;
  }

  console.log(`drained ${logs.length} logs as JSON`);
  console.log(JSON.stringify(logs, null, 2));
  res.end("ok");
};
