const auth = require("../lib/auth");
const fetchApi = require("../lib/fetch-api");

function sleep(t) {
  return new Promise(r => setTimeout(r, t));
}

module.exports = auth(async (req, res) => {
  for (let i = 0; i < 6; i++) {
    console.log(`invoking update: ${i}`);
    // don't wait for response
    fetchApi("/update/all.js");

    const isLast = i === 5;
    if (!isLast) await sleep(10000);
  }

  res.end("ok");
});
