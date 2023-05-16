const { Router } = require('express');

const ctrl = require('../../controllers/friends');

const { validateQuery } = require('../../middlewares');

const { schemas } = require('../../models/friends');

const router = Router();

router.get('/friends', validateQuery(schemas.getQueryParams), ctrl.getFriends);

module.exports = router;
