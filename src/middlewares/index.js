const validateBody = require('./validateBody');
const validateQuery = require('./validateQuery');
const validateId = require('./validateId');
const upload = require('./upload');
const uploadCloud = require('./uploadCloud');
const authenticate = require('./authenticate');
const tryAuthenticate = require('./tryAuthenticate');

module.exports = {
  validateBody,
  validateQuery,
  validateId,
  upload,
  uploadCloud,
  authenticate,
  tryAuthenticate,
};
