const { HttpError, authenticateBearer } = require('../helpers');

const authenticate = async (req, res, next) => {
  const user = await authenticateBearer(req.headers.authorization);

  if (!user) {
    next(new HttpError(401));
    return;
  }

  req.user = user;
  next();
};

module.exports = authenticate;
