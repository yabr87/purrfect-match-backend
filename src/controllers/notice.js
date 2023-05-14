const { ctrlWrapper, HttpError } = require('../helpers');

const { Notice } = require('../models/notice');

const get = async (req, res) => {
  const { user: { _id: userId } = {}, query } = req;

  const { page = 1, limit = 20, favorite, own, title, ...filter } = query;
  const skip = (page - 1) * limit;

  if (title) {
    filter['title'] = { $regex: title, $options: 'i' };
  }

  if (own !== undefined) {
    if (!userId) {
      throw new HttpError(401);
    }
    filter['owner'] = own ? userId : { $ne: userId };
  }

  if (favorite !== undefined) {
    if (!userId) {
      throw new HttpError(401);
    }
    filter['favorites'] = favorite
      ? { $all: [userId] } //new ObjectId(userId)
      : { $not: { $all: [userId] } };
  }
  const notices = await Notice.find(filter, undefined, {
    skip,
    limit,
    sort: {
      updatedAt: -1,
    },
  }).lean();

  notices.forEach(notice => {
    formatNotice(notice, userId);
  });

  res.json(notices);
};

const getById = async (req, res) => {
  const { noticeId } = req.params;
  const userId = req.user?._id;
  const notice = await Notice.findById(noticeId)
    .populate('owner', '-_id phone city')
    .lean();

  if (!notice) {
    throw new HttpError(404);
  }

  res.json(formatNotice(notice, userId));
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
