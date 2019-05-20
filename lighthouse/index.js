module.exports = async (req, res) => {
  res.statusCode = 302;
  res.setHeader(
    "Location",
    "https://front-git-integrations.zeit.sh/integration/lighthouse"
  );
  res.end();
};
