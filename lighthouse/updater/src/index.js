const { request } = require("https");
const { parse } = require("url");

const { API_SECRET, ENDPOINT } = process.env;
if (!API_SECRET) {
  throw new Error("Missing environment variable: API_SECRET");
}

if (!ENDPOINT) {
  throw new Error("Missing environment variable: ENDPOINT");
}

console.log("ENDPOINT: ", ENDPOINT);

const parsed = parse(ENDPOINT);
const options = {
  method: "POST",
  hostname: parsed.hostname,
  port: parsed.port,
  path: parsed.path,
  headers: {
    Authorization: `Bearer ${API_SECRET}`
  }
};

exports.handler = async () => {
  await new Promise((resolve, reject) => {
    // don't wait for response
    const req = request(options);
    req.on("error", reject);
    req.end("", resolve);
  });
  return "ok";
};
