const multer = require('multer');
const path = require('path');
const { HttpError } = require('../helpers');

const tempDir = path.resolve('tmp');

const multerConfig = multer.diskStorage({
  destination: tempDir,
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/bmp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new HttpError(
        400,
        'Unsupported file type. Supported types: jpeg, png, bmp'
      )
    );
  }
};

const upload = multer({
  storage: multerConfig,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
});

module.exports = upload;
