const { Router } = require('express');

const ctrl = require('../../controllers/notice');

const {
  authenticate,
  validateBody,
  validateQuery,
  validateId,
  uploadCloud,
  tryAuthenticate,
} = require('../../middlewares');

const { schemas } = require('../../models/notice');

const router = Router();

router.get('/', tryAuthenticate, validateQuery(schemas.getParams), ctrl.get);

router.post(
  '/',
  authenticate,
  uploadCloud(schemas.photoConfig),
  validateBody(schemas.addParams),
  ctrl.add
);

router.get('/:noticeId', tryAuthenticate, validateId('noticeId'), ctrl.getById);

router.patch(
  '/:noticeId',
  authenticate,
  validateId('noticeId'),
  uploadCloud(schemas.photoConfig),
  validateBody(schemas.updateParams),
  ctrl.updateById
);

router.delete(
  '/:noticeId',
  authenticate,
  validateId('noticeId'),
  ctrl.removeById
);

router.post(
  '/:noticeId/favorite',
  authenticate,
  validateId('noticeId'),
  ctrl.addToFavorites
);

router.delete(
  '/:noticeId/favorite',
  authenticate,
  validateId('noticeId'),
  ctrl.removeFromFavorites
);

router.patch(
  '/:noticeId/favorite',
  authenticate,
  validateId('noticeId'),
  validateBody(schemas.updateFavoriteParams),
  ctrl.updateFavorite
);
module.exports = router;
