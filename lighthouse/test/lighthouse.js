"use strict";

const test = require("ava");

const {
  createHandler
} = require("../lighthouse");

const identity = (str) => str;

test("generate lighthouse report", async (t) => {
  let resBuffer;
  let mongoResult;

  const req = {
    body: {
      id: 123,
      url: "vercel.com",
      ownerId: 456,
    },
  };

  const res = {
    end: (str) => (resBuffer = str)
  };

  async function mongo() {
    return {
      collection: () => {
        return {
          updateOne: (query, obj) => (mongoResult = obj),
        };
      },
    };
  }

  const handler = createHandler({
    mongo,
    gzip: identity
  });
  await handler(req, res);

  t.is(resBuffer, "ok");
  t.is(typeof mongoResult.$set.report, "string");
  t.is(typeof mongoResult.$set.scores, "object");
  t.is(typeof mongoResult.$set.lhError, "undefined");
  t.is(mongoResult.$set.id, req.body.id);
  t.is(mongoResult.$set.ownerId, req.body.ownerId);
  t.is(mongoResult.$set.url, req.body.url);
});

test("handle lighthouse errors", async (t) => {
  let resBuffer;
  let mongoResult;

  const req = {
    body: {
      id: 123,
      url: "files-ey8twc806.now.sh",
      ownerId: 456,
    },
  };

  const res = {
    end: (str) => (resBuffer = str)
  };

  async function mongo() {
    return {
      collection: () => {
        return {
          updateOne: (query, obj) => (mongoResult = obj),
        };
      },
    };
  }

  const handler = createHandler({
    mongo,
    gzip: identity
  });

  await handler(req, res);

  t.is(resBuffer, "ok");
  t.is(typeof mongoResult.$set.report, "undefined");
  t.is(typeof mongoResult.$set.scores, "undefined");
  t.is(typeof mongoResult.$set.lhError, "string");
  t.is(mongoResult.$set.id, req.body.id);
  t.is(mongoResult.$set.ownerId, req.body.ownerId);
  t.is(mongoResult.$set.url, req.body.url);
});