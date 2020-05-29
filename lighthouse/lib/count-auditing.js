module.exports = db => {
  return db
    .collection("deployments")
    .countDocuments({ auditing: { $ne: null } });
};
