const chrome = require("chrome-aws-lambda");
const lighthouse = require("lighthouse");
const puppeteer = require("puppeteer-core");
const rawBody = require("raw-body");
const { parse } = require("url");
const { promisify } = require("util");
const zlib = require("zlib");
const auth = require("../lib/auth");
const mongo = require("../lib/mongo");

const gzip = promisify(zlib.gzip);

let args;
let executablePath;
if (process.platform === "darwin") {
  args = chrome.args.filter(a => a !== "--single-process");
  executablePath = Promise.resolve(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  );
} else {
  args = chrome.args;
  executablePath = chrome.executablePath;
}

async function lh(url) {
  let browser;

  try {
    browser = await puppeteer.launch({
      args,
      executablePath: await executablePath
    });
    const { port } = parse(browser.wsEndpoint());
    return await lighthouse(url, {
      port,
      output: "html",
      logLevel: "error"
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function handler(req, res) {
  const body = await rawBody(req);
  let id;
  let url;
  let ownerId;

  try {
    ({ id, url, ownerId } = JSON.parse(body));
  } catch (err) {
    res.statusCode = 400;
    res.end("Invalid JSON");
    return;
  }

  if (!id || !url || !ownerId) {
    res.statusCode = 400;
    res.end("Missing required properties: id, url or ownerId");
    return;
  }

  let result;
  let lhError;

  console.log(`generating report: ${id}, ${url}`);
  try {
    result = await lh(`https://${url}`);
  } catch (err) {
    if (err.code === "NO_FCP") {
      console.warn(err);
      lhError = err.friendlyMessage || err.message;
    } else {
      throw err;
    }
  }

  let scores;
  let report;
  if (result) {
    scores = Object.values(result.lhr.categories).reduce((o, c) => {
      o[c.id] = c.score;
      return o;
    }, {});

    report = await gzip(result.report);
  }

  console.log(`saving deployment: ${id}, ${url}`);
  // don't pre-connect mongo since lighthouse audits can take a long time
  const db = await mongo();
  await db.collection("deployments").updateOne(
    { id },
    {
      $set: {
        id,
        url,
        ownerId,
        scores,
        report,
        lhError,
        auditing: null
      },
      $setOnInsert: {
        createdAt: Date.now()
      }
    },
    { upsert: true }
  );

  res.end("ok");
}

// FIXME: hack not to exit on errors of lighthouse
process.on("uncaughtException", err => {
  console.error("uncaughtException:", err);
});

module.exports = mongo.withClose(auth(handler));
