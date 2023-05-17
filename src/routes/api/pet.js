const { Router } = require('express');

const ctrl = require('../../controllers/pet');

const {
  authenticate,
  validateBody,
  validateQuery,
  validateId,
  uploadCloud,
} = require('../../middlewares');

const { schemas } = require('../../models/pet');

const router = Router();

router.get('/', authenticate, validateQuery(schemas.getParams), ctrl.get);

router.post(
  '/',
  authenticate,
  uploadCloud(schemas.photoConfig),
  validateBody(schemas.addParams),
  ctrl.add
);

router.delete('/:petId', authenticate, validateId('petId'), ctrl.removeById);

module.exports = router;
