module.exports = async (req, res) => {
  res.statusCode = 302;
  res.setHeader("Location", "https://zeit.co/integrations/lighthouse");
  res.end();
};
