const { WebClient } = require("@slack/web-api");
const { AUDIT_QUEUE_WARN_THRESHOLD } = require("./constants");
const countAuditing = require("./count-auditing");

module.exports = async db => {
  if (!process.env.SLACK_TOKEN || !process.env.SLACK_CHANNEL) {
    return;
  }

  const count = await countAuditing(db);
  if (count < AUDIT_QUEUE_WARN_THRESHOLD) {
    return;
  }

  const web = new WebClient(process.env.SLACK_TOKEN);
  await web.chat.postMessage({
    channel: process.env.SLACK_CHANNEL,
    text: `Lighthouse integration: audit queue is flooding (${count})`
  });
};
