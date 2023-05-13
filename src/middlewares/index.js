const validateBody = require('./validateBody');
const validateQuery = require('./validateQuery');
const upload = require('./upload');
const uploadCloud = require('./uploadCloud');
const authenticate = require('./authenticate');

module.exports = {
  validateBody,
  validateQuery,
  upload,
  uploadCloud,
  authenticate,
};
