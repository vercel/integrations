const REQUIRED = ["CLIENT_ID", "CLIENT_SECRET", "HOST"];

for (const name of REQUIRED) {
  if (!process.env[name]) {
    throw new Error(`Missing environment variables: ${name}`);
  }
}

module.exports = process.env;
