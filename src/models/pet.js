const { Schema, model } = require('mongoose');
const Joi = require('joi');

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 16;
const BREED_MIN_LENGTH = 2;
const BREED_MAX_LENGTH = 16;

// Mongoose schema:

const petSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'users',
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    birthday: {
      type: String,
      required: [true, 'Birthday is required'],
    },
    breed: {
      type: String,
      default: '',
    },
    photoUrl: {
      type: String,
      required: [true, 'Pet photo is required'],
    },
    comments: {
      type: String,
    },
  },
  { versionKey: false, timestamps: true }
);

const Pet = model('pet', petSchema);

// Validation schemas:

const addParams = Joi.object({
  name: Joi.string().required().min(NAME_MIN_LENGTH).max(NAME_MAX_LENGTH),
  birthday: Joi.string()
    .required()
    .pattern(/^\d{2}.\d{2}.\d{4}$/),
  breed: Joi.string().required().min(BREED_MIN_LENGTH).max(BREED_MAX_LENGTH),
  comments: Joi.string().min(8).max(120),
});

const getParams = Joi.object({
  page: Joi.number().integer().positive(),
  limit: Joi.number().integer().positive(),
});

const schemas = {
  addParams,
  getParams,
};

module.exports = {
  Pet,
  schemas,
};
