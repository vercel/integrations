"use strict";

const test = require("ava");

const { createHandler } = require("../api/lighthouse");

const identity = str => str;

test("generate lighthouse report", async t => {
  let resBuffer;
  let mongoResult;

  const req = {
    body: {
      deployments: [
        {
          id: 123,
          url: "vercel.com",
          ownerId: 456
        }
      ],
      startAt: Date.now()
    }
  };

  const res = {
    end: str => (resBuffer = str)
  };

  async function mongo() {
    return {
      collection: () => {
        return {
          bulkWrite: operations => (mongoResult = operations),
          find: () => ({ toArray: async () => [] })
        };
      }
    };
  }

  const handler = createHandler({
    mongo,
    gzip: identity
  });
  await handler(req, res);

  t.is(resBuffer, "ok");
  t.is(mongoResult.length, 1);
  const [{ updateOne }] = mongoResult;
  t.is(updateOne.filter.id, req.body.deployments[0].id);
  t.is(typeof updateOne.update.$set.report, "string");
  t.is(typeof updateOne.update.$set.scores, "object");
  t.is(typeof updateOne.update.$set.lhError, "undefined");
  t.is(updateOne.update.$set.id, req.body.deployments[0].id);
  t.is(updateOne.update.$set.ownerId, req.body.deployments[0].ownerId);
  t.is(updateOne.update.$set.url, req.body.deployments[0].url);
  t.is(updateOne.upsert, true);
});

test("handle lighthouse errors", async t => {
  let resBuffer;
  let mongoResult;

  const req = {
    body: {
      deployments: [
        {
          id: 123,
          url: "files-ey8twc806.now.sh",
          ownerId: 456
        }
      ],
      startAt: Date.now()
    }
  };

  const res = {
    end: str => (resBuffer = str)
  };

  async function mongo() {
    return {
      collection: () => {
        return {
          bulkWrite: operations => (mongoResult = operations),
          find: () => ({ toArray: async () => [] })
        };
      }
    };
  }

  const handler = createHandler({
    mongo,
    gzip: identity
  });

  await handler(req, res);

  t.is(resBuffer, "ok");
  t.is(mongoResult.length, 1);
  const [{ updateOne }] = mongoResult;
  t.is(updateOne.filter.id, req.body.deployments[0].id);
  t.is(typeof updateOne.update.$set.report, "string");
  t.is(typeof updateOne.update.$set.scores, "object");
  t.is(typeof updateOne.update.$set.lhError, "undefined");
  t.is(updateOne.update.$set.id, req.body.deployments[0].id);
  t.is(updateOne.update.$set.ownerId, req.body.deployments[0].ownerId);
  t.is(updateOne.update.$set.url, req.body.deployments[0].url);
  t.is(updateOne.upsert, true);
});
