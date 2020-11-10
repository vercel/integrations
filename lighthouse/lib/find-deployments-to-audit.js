module.exports = db => {
  return db
    .collection("deployments")
    .find(
      { auditing: { $ne: null } },
      {
        limit: 10,
        projection: { id: 1, url: 1, ownerId: 1 },
        sort: [["auditing", 1]]
      }
    )
    .toArray();
};
