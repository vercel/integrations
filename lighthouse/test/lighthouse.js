"use strict";

const test = require("ava");

const { createHandler } = require("../lighthouse");

const identity = str => str;

test("generate lighthouse report", async t => {
  let resBuffer;
  let mongoResult;

  const req = {
    body: [
      {
        id: 123,
        url: "vercel.com",
        ownerId: 456
      }
    ]
  };

  const res = {
    end: str => (resBuffer = str)
  };

  async function mongo() {
    return {
      collection: () => {
        return {
          bulkWrite: operations => (mongoResult = operations)
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
  t.is(updateOne.filter.id, req.body[0].id);
  t.is(typeof updateOne.update.$set.report, "string");
  t.is(typeof updateOne.update.$set.scores, "object");
  t.is(typeof updateOne.update.$set.lhError, "undefined");
  t.is(updateOne.update.$set.id, req.body[0].id);
  t.is(updateOne.update.$set.ownerId, req.body[0].ownerId);
  t.is(updateOne.update.$set.url, req.body[0].url);
  t.is(updateOne.upsert, true);
});

test("handle lighthouse errors", async t => {
  let resBuffer;
  let mongoResult;

  const req = {
    body: [
      {
        id: 123,
        url: "files-ey8twc806.now.sh",
        ownerId: 456
      }
    ]
  };

  const res = {
    end: str => (resBuffer = str)
  };

  async function mongo() {
    return {
      collection: () => {
        return {
          bulkWrite: operations => (mongoResult = operations)
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
  t.is(updateOne.filter.id, req.body[0].id);
  t.is(typeof updateOne.update.$set.report, "undefined");
  t.is(typeof updateOne.update.$set.scores, "undefined");
  t.is(typeof updateOne.update.$set.lhError, "string");
  t.is(updateOne.update.$set.id, req.body[0].id);
  t.is(updateOne.update.$set.ownerId, req.body[0].ownerId);
  t.is(updateOne.update.$set.url, req.body[0].url);
  t.is(updateOne.upsert, true);
});
