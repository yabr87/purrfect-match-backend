const { authenticateBearer } = require('../helpers');

const tryAuthenticate = async (req, res, next) => {
  const user = await authenticateBearer(req.headers.authorization);

  if (user) {
    req.user = user;
  }

  next();
};

module.exports = tryAuthenticate;
