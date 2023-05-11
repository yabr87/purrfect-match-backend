const { Router } = require('express');

const ctrl = require('../../controllers/auth');

const { authenticate, validateBody, upload } = require('../../middlewares');

const { schemas } = require('../../models/user');

const router = Router();

router.post('/register', validateBody(schemas.register), ctrl.register);

router.post('/login', validateBody(schemas.login), ctrl.login);

router.post('/logout', authenticate, ctrl.logout);

router.get('/current', authenticate, ctrl.getCurrent);

router.patch(
  '/current',
  authenticate,
  upload.single('avatar'),
  validateBody(schemas.update),
  ctrl.updateCurrent
);

router.patch(
  '/avatars',
  authenticate,
  upload.single('avatar'),
  ctrl.updateAvatar
);

module.exports = router;
