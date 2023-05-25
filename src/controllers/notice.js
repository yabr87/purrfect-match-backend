const subDate = require('date-fns/sub');
const addDate = require('date-fns/add');

const { ctrlWrapper, HttpError, removeFromCloud } = require('../helpers');

const { Notice } = require('../models/notice');
const { User } = require('../models/user');
const { NOTICE_CATEGORIES } = require('../models/notice').constants;

const get = async (req, res) => {
  const { user: { _id: userId } = {}, query } = req;

  const { page = 1, limit = 12, favorite, own, title, age, ...filter } = query;
  const skip = (page - 1) * limit;

  if (title) {
    filter.title = { $regex: title, $options: 'i' };
  }

  if (own !== undefined) {
    if (!userId) {
      throw new HttpError(401);
    }
    filter.owner = own ? userId : { $ne: userId };
  }

  if (favorite !== undefined) {
    if (!userId) {
      throw new HttpError(401);
    }
    filter.favorites = favorite
      ? { $all: [userId] }
      : { $not: { $all: [userId] } };
  }

  if (age?.length > 0) {
    const ageFilter = age.map(ageOption => {
      const dateFrom = subDate(new Date(), { years: ageOption + 1 });
      const dateUntil = subDate(new Date(), { years: ageOption });

      return ageOption <= 1
        ? { birthday: { $gte: dateFrom, $lt: dateUntil } }
        : { birthday: { $lt: dateUntil } };
    });

    filter.$or = ageFilter;
  }

  const totalResults = await Notice.find(filter).count();
  const notices = await Notice.find(filter, null, {
    skip,
    limit,
    sort: {
      promoDate: -1,
    },
  }).lean();

  notices.forEach(notice => {
    formatNotice(notice, userId);
  });

  res.json({
    totalResults,
    page,
    totalPages: Math.ceil(totalResults / limit),
    results: notices,
  });
};

const getById = async (req, res) => {
  const { noticeId } = req.params;
  const userId = req.user?._id;
  const notice = await Notice.findById(noticeId).lean();

  if (!notice) {
    throw new HttpError(404);
  }
  const owner = await User.findById(notice.owner, '-_id email phone').lean();
  formatNotice(notice, userId);
  notice.owner = owner;
  res.json(notice);
};

const add = async (req, res) => {
  const {
    user: { _id: userId, balance = 0 },
    body,
    file,
  } = req;
  body.photoUrl = file.path;

  const { promo } = body;
  if (promo) {
    if (balance < promo) {
      throw new HttpError(400, 'Not enough funds');
    }
    body.promoDate = addDate(new Date(), { days: promo });
    delete body.promo;
  }

  const notice = (await Notice.create({ ...body, owner: userId })).toObject();

  if (promo) {
    await User.findByIdAndUpdate(userId, { $inc: { balance: -promo } });
  }

  res.status(201).json(formatNotice(notice, userId));
};

const updateById = async (req, res) => {
  const {
    user: { _id: userId, balance = 0 },
    body,
    file,
    params: { noticeId },
  } = req;

  if (Object.keys(body).length === 0 && !file) {
    throw new HttpError(400, 'Missing fields');
  }

  let notice = await Notice.findOne(
    { _id: noticeId, owner: userId },
    'category price photoUrl promoDate'
  );

  if (!notice) {
    throw new HttpError(404);
  }

  const oldPhotoUrl = notice.photoUrl;

  if (file) {
    body.photoUrl = file.path;
  }

  const { promo } = body;
  if (promo) {
    if (balance < promo) {
      throw new HttpError(400, 'Not enough funds');
    }
    const basePromoDate = Math.max(notice.promoDate, Date.now());
    body.promoDate = addDate(basePromoDate, { days: promo });
    delete body.promo;
  }

  const category = body.category ?? notice.category;
  const price = body.price ?? notice.price;

  if (body.category === NOTICE_CATEGORIES.sell && !price) {
    throw new HttpError(400, 'Price is needed');
  }
  if (body.price && category !== NOTICE_CATEGORIES.sell) {
    throw new HttpError(400, 'Unexpected field Price');
  }

  body.category = category;
  if (category === NOTICE_CATEGORIES.sell) {
    body.price = price;
  } else {
    body.$unset = { price: '' };
  }

  notice = await Notice.findOneAndUpdate(
    { _id: noticeId, owner: userId },
    { ...body },
    { new: true }
  ).lean();

  if (promo) {
    await User.findByIdAndUpdate(userId, { $inc: { balance: -promo } });
  }

  if (oldPhotoUrl !== notice.photoUrl) {
    removeFromCloud(oldPhotoUrl);
  }

  res.json(formatNotice(notice, userId));
};

const removeById = async (req, res) => {
  const {
    user: { _id: userId },
    params: { noticeId },
  } = req;
  const notice = await Notice.findOneAndRemove({
    _id: noticeId,
    owner: userId,
  }).lean();

  if (!notice) {
    throw new HttpError(404);
  }

  removeFromCloud(notice.photoUrl);

  res.json(formatNotice(notice, userId));
};

const addToFavorites = async (req, res) => {
  const {
    user: { _id: userId },
    params: { noticeId },
  } = req;
  const notice = await Notice.findByIdAndUpdate(
    noticeId,
    { $addToSet: { favorites: userId } },
    { new: true }
  ).lean();
  if (!notice) {
    throw new HttpError(404);
  }

  res.json(formatNotice(notice, userId));
};

const removeFromFavorites = async (req, res) => {
  const {
    user: { _id: userId },
    params: { noticeId },
  } = req;
  const notice = await Notice.findByIdAndUpdate(
    noticeId,
    { $pull: { favorites: userId } },
    { new: true }
  ).lean();
  if (!notice) {
    throw new HttpError(404);
  }

  res.json(formatNotice(notice, userId));
};

const updateFavorite = async (req, res) => {
  const { favorite } = req.body;
  if (favorite) {
    addToFavorites(req, res);
  } else {
    removeFromFavorites(req, res);
  }
};

// Utils:

const formatNotice = (notice, userId) => {
  if (userId) {
    const userIdStr = userId.toString();
    notice.favorite = Boolean(
      notice.favorites?.find(id => id.toString() === userIdStr)
    );
    notice.own = notice.owner.toString() === userIdStr;
  } else {
    notice.favorite = false;
    notice.own = false;
  }
  delete notice.favorites;
  delete notice.owner;
  // delete notice.promoDate;
  return notice;
};

module.exports = {
  get: ctrlWrapper(get),
  add: ctrlWrapper(add),
  getById: ctrlWrapper(getById),
  updateById: ctrlWrapper(updateById),
  removeById: ctrlWrapper(removeById),
  addToFavorites: ctrlWrapper(addToFavorites),
  removeFromFavorites: ctrlWrapper(removeFromFavorites),
  updateFavorite: ctrlWrapper(updateFavorite),
};
