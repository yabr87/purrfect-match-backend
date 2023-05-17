const cloudinary = require('cloudinary').v2;

const removeFromCloud = fileUrl => {
  if (!fileUrl.includes('cloudinary.com')) {
    return;
  }
  console.log(fileUrl);
  const versionIndex = fileUrl.search(/\/v\d/);
  const fileId = fileUrl
    .slice(fileUrl.indexOf('/', versionIndex + 1) + 1)
    .split('.')[0];
  console.log(fileId);
  return cloudinary.uploader.destroy(fileId);
};

module.exports = removeFromCloud;
