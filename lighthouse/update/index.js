const auth = require("../lib/auth");
const fetchApi = require("../lib/fetch-api");

function sleep(t) {
  return new Promise(r => setTimeout(r, t));
}

const PER_SECONDS = 20;
const COUNTS = Math.floor(60 / PER_SECONDS);

module.exports = auth(async (req, res) => {
  for (let i = 0; i < COUNTS; i++) {
    console.log(`invoking update: ${i}`);
    // don't wait for response
    fetchApi("/update/all.js");

    const isLast = i === COUNTS - 1;
    if (!isLast) await sleep(PER_SECONDS * 1000);
  }

  res.end("ok");
});
