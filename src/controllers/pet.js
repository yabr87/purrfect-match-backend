const { ctrlWrapper, HttpError, removeFromCloud } = require('../helpers');

const { Pet } = require('../models/pet');

const get = async (req, res) => {
  const {
    user: { _id: userId },
    query,
  } = req;

  const { page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const totalResults = await Pet.find({ owner: userId }).count();
  const pets = await Pet.find({ owner: userId }, null, {
    skip,
    limit,
    sort: {
      updatedAt: -1,
    },
  }).lean();

  res.json({
    totalResults,
    page,
    totalPages: Math.ceil(totalResults / limit),
    results: pets,
  });
};

const add = async (req, res) => {
  const {
    user: { _id: userId },
    body,
    file,
  } = req;
  body.photoUrl = file.path;
  const pet = (await Pet.create({ ...body, owner: userId })).toObject();
  res.status(201).json(pet);
};

const removeById = async (req, res) => {
  const {
    user: { _id: userId },
    params: { petId },
  } = req;
  const pet = await Pet.findOneAndRemove({
    _id: petId,
    owner: userId,
  }).lean();

  if (!pet) {
    throw new HttpError(404);
  }

  removeFromCloud(pet.photoUrl);

  res.json(pet);
};

module.exports = {
  get: ctrlWrapper(get),
  add: ctrlWrapper(add),
  removeById: ctrlWrapper(removeById),
};
