const { Router } = require('express');

const ctrl = require('../../controllers/news');

const { validateQuery } = require('../../middlewares');

const { schemas } = require('../../models/news');

const router = Router();

router.get('/', validateQuery(schemas.getQueryParams), ctrl.getNews);

module.exports = router;
