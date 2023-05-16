const { Schema, model } = require('mongoose');
const Joi = require('joi');
const handleMongooseError = require('../helpers/handleMongooseError');

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 16;
const BREED_MIN_LENGTH = 2;
const BREED_MAX_LENGTH = 16;
const COMMENTS_MIN_LENGTH = 0;
const COMMENTS_MAX_LENGTH = 120;

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
      type: Date,
      required: [true, 'Birthday is required'],
    },
    breed: {
      type: String,
      required: [true, 'Breed is required'],
    },
    photoUrl: {
      type: String,
      required: [true, 'Pet photo is required'],
    },
    comments: {
      type: String,
      default: '',
    },
  },
  { versionKey: false, timestamps: true }
);

petSchema.post('save', handleMongooseError);
const Pet = model('pet', petSchema);

// Validation schemas:

const addParams = Joi.object({
  name: Joi.string().required().min(NAME_MIN_LENGTH).max(NAME_MAX_LENGTH),
  birthday: Joi.date().iso().less('now').required(),
  breed: Joi.string().required().min(BREED_MIN_LENGTH).max(BREED_MAX_LENGTH),
  comments: Joi.string().min(COMMENTS_MIN_LENGTH).max(COMMENTS_MAX_LENGTH),
});

const getParams = Joi.object({
  page: Joi.number().integer().min(1).empty(''),
  limit: Joi.number().integer().min(1).max(100).empty(''),
});

const schemas = {
  addParams,
  getParams,
};

module.exports = {
  Pet,
  schemas,
};
