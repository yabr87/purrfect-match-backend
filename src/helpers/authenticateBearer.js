const jwt = require('jsonwebtoken');
const { User } = require('../models/user');

const { ACCESS_SECRET_KEY } = process.env;

const authenticateBearer = async (authorization = '') => {
  const [bearer, accessToken] = authorization.split(' ');

  if (bearer !== 'Bearer') {
    return null;
  }

  try {
    const { id } = jwt.verify(accessToken, ACCESS_SECRET_KEY);
    const user = await User.findById(id);

    if (!user || !user.accessToken || user.accessToken !== accessToken) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
};

module.exports = authenticateBearer;