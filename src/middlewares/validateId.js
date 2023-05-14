const { isValidObjectId } = require('mongoose');

const { HttpError } = require('../helpers');

const validateId =
  (idName = 'id') =>
  (req, res, next) => {
    const id = req.params[idName];
    if (!isValidObjectId(id)) {
      next(new HttpError(400, `${id} is not valid id`));
    }
    next();
  };

module.exports = validateId;
