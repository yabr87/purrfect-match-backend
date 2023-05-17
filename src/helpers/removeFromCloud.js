const cloudinary = require('cloudinary').v2;

const removeFromCloud = fileUrl => {
  if (!fileUrl.includes('cloudinary.com')) {
    return;
  }

  const versionIndex = fileUrl.search(/\/v\d/);
  const fileId = fileUrl
    .slice(fileUrl.indexOf('/', versionIndex + 1) + 1)
    .split('.')[0];

  return cloudinary.uploader.destroy(fileId);
};

module.exports = removeFromCloud;
