const auth = require("../lib/auth");
const fetchApi = require("../lib/fetch-api");
const sleep = require("../lib/sleep");

const PER_SECONDS = 60;
const COUNTS = Math.floor(60 / PER_SECONDS);

module.exports = auth(async (req, res) => {
  for (let i = 0; i < COUNTS; i++) {
    console.log(`invoking update: ${i}`);
    Promise.all([
      fetchApi("/update/users.js"),
      fetchApi("/update/teams.js")
    ]).catch(console.error);

    const isLast = i === COUNTS - 1;
    if (!isLast) await sleep(PER_SECONDS * 1000);
  }

  await sleep(1000);
  res.end("ok");
});
