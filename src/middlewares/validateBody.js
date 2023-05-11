const { HttpError } = require('../helpers');

const validateBody = schema => (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) {
    const message = error?.details[0].message;
    next(new HttpError(400, message));
    return;
  }
  req.body = value;
  next();
};

module.exports = validateBody;
