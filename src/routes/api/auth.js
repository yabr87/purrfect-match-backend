const { Router } = require('express');

const ctrl = require('../../controllers/auth');

const {
  authenticate,
  validateBody,
  upload,
  uploadCloud,
} = require('../../middlewares');

const { schemas } = require('../../models/user');

const router = Router();

router.post('/register', validateBody(schemas.register), ctrl.register);

router.post('/login', validateBody(schemas.login), ctrl.login);

router.post('/logout', authenticate, ctrl.logout);

router.get('/current', authenticate, ctrl.getCurrent);

router.patch(
  '/current',
  authenticate,
  // upload.single('avatar'),
  uploadCloud.single('avatar'),
  validateBody(schemas.update),
  ctrl.updateCurrent
);

router.patch(
  '/current/avatar',
  authenticate,
  // upload.single('avatar'),
  uploadCloud.single('avatar'),
  ctrl.updateAvatar
);

module.exports = router;
