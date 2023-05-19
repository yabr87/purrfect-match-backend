const dateSub = require('date-fns/sub');

const { ctrlWrapper, HttpError, removeFromCloud } = require('../helpers');

const { Notice } = require('../models/notice');
const { User } = require('../models/user');

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
    const ageFilter = age.map(fullYears => {
      const dateFrom = dateSub(new Date(), { years: fullYears + 1 });
      const dateUntil = dateSub(new Date(), { years: fullYears });

      const dateRangeCondition = {
        $and: [
          { birthday: { $gte: dateFrom } },
          { birthday: { $lt: dateUntil } },
        ],
      };

      return dateRangeCondition;
    });

    if (age.length === 1) {
      filter.$and = ageFilter[0].$and;
    } else {
      filter.$or = ageFilter;
    }
  }

  const totalResults = await Notice.find(filter).count();
  const notices = await Notice.find(filter, null, {
    skip,
    limit,
    sort: {
      createdAt: -1,
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
    user: { _id: userId },
    body,
    file,
  } = req;
  body.photoUrl = file.path;
  const notice = (await Notice.create({ ...body, owner: userId })).toObject();
  res.status(201).json(formatNotice(notice, userId));
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
  return notice;
};

module.exports = {
  get: ctrlWrapper(get),
  add: ctrlWrapper(add),
  getById: ctrlWrapper(getById),
  removeById: ctrlWrapper(removeById),
  addToFavorites: ctrlWrapper(addToFavorites),
  removeFromFavorites: ctrlWrapper(removeFromFavorites),
  updateFavorite: ctrlWrapper(updateFavorite),
};
