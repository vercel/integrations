const { Sema } = require("async-sema");
const cookie = require("cookie");
const { parse } = require("url");
const {
  COOKIE_MAX_AGE,
  AUDIT_DEPLOYMENTS_COUNT,
  AUDIT_DEPLOYMENTS_CREATED_AFTER
} = require("../lib/constants");
const { HOST } = require("../lib/env");
const fetchAccessToken = require("../lib/fetch-access-token");
const fetchDeployments = require("../lib/fetch-deployments");
const fetchUser = require("../lib/fetch-user");
const mongo = require("../lib/mongo");

module.exports = mongo.withClose(async (req, res) => {
  const {
    query: { code, next, teamId }
  } = parse(req.url, true);

  if (!code) {
    res.statusCode = 400;
    res.end("missing query parameter: code");
    return;
  }

  console.log("fetching accessToken");
  const accessToken = await fetchAccessToken({
    code,
    redirectUri: `${HOST}/callback.js`
  });

  console.log(`fetching${teamId ? "" : " user and"} deployments`);
  let [user, deployments] = await Promise.all([
    teamId ? null : fetchUser({ accessToken }),
    fetchDeployments({
      accessToken,
      limit: AUDIT_DEPLOYMENTS_COUNT,
      since: Date.now() - AUDIT_DEPLOYMENTS_CREATED_AFTER,
      teamId
    })
  ]);

  deployments = deployments.filter(d => d.state === "READY");

  const db = await mongo();

  if (user) {
    console.log(`> saving user: ${user.uid}, ${user.username}`);
    await db.collection("users").updateOne(
      { id: user.uid },
      {
        $set: {
          id: user.uid,
          accessToken
        },
        $setOnInsert: {
          createdAt: Date.now()
        }
      },
      { upsert: true }
    );
  } else {
    console.log(`> saving team: ${teamId}`);
    await db.collection("teams").updateOne(
      { id: teamId },
      {
        $set: {
          id: teamId,
          accessToken
        },
        $setOnInsert: {
          createdAt: Date.now()
        }
      },
      { upsert: true }
    );
  }

  const deploymentsCollection = db.collection("deployments");
  const sema = new Sema(10);

  console.log(`> saving deployments: ${deployments.length}`);
  await Promise.all(
    deployments.map(async d => {
      await sema.acquire();

      try {
        const now = Date.now();
        return await deploymentsCollection.updateOne(
          { id: d.uid },
          {
            $setOnInsert: {
              id: d.uid,
              url: d.url,
              ownerId: teamId || user.uid,
              scores: null,
              report: null,
              lhError: null,
              auditing: now,
              createdAt: now
            }
          },
          { upsert: true }
        );
      } finally {
        sema.release();
      }
    })
  );
  mongo.close().catch(console.error);

  if (user) {
    const setCookie = cookie.serialize("accessToken", accessToken, {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      secure: req.connection.encrypted
    });
    res.setHeader("Set-Cookie", setCookie);
  }

  res.statusCode = 302;
  res.setHeader("Location", next);
  res.end();
});
