const { HttpError } = require('../helpers');

const validateQuery = schema => (req, res, next) => {
  const { error, value } = schema.validate(req.query);
  if (error) {
    const message = error?.details[0].message;
    next(new HttpError(400, message));
    return;
  }
  req.query = value;
  next();
};

module.exports = validateQuery;
