const jwt = require('jsonwebtoken');
const { User } = require('../models/user');

const { SECRET_KEY } = process.env;

const authenticateBearer = async (authorization = '') => {
  const [bearer, token] = authorization.split(' ');

  if (bearer !== 'Bearer') {
    return null;
  }

  try {
    const { id } = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(id);

    if (!user || !user.token || user.token !== token) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
};

module.exports = authenticateBearer;