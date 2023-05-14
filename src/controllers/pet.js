const { json } = require('express');
const { ctrlWrapper, HttpError } = require('../helpers');

const { Pet } = require('../models/pet');

const get = async (req, res) => {
  const {
    user: { _id: userId },
    query,
  } = req;

  const { page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;
  const pets = await Pet.find({ owner: userId }, null, {
    skip,
    limit,
    sort: {
      updatedAt: -1,
    },
  }).lean();

  res.json(pets);
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

  res.json(pet);
};

module.exports = {
  get: ctrlWrapper(get),
  add: ctrlWrapper(add),
  removeById: ctrlWrapper(removeById),
};
