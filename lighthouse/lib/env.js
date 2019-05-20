const REQUIRED = [
  "API_SECRET",
  "CLIENT_ID",
  "CLIENT_SECRET",
  "HOST",
  "MONGO_DB",
  "MONGO_URI"
];

for (const name of REQUIRED) {
  if (!process.env[name]) {
    throw new Error(`Missing environment variables: ${name}`);
  }
}

module.exports = process.env;
