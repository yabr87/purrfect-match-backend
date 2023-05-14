const { Schema, model } = require('mongoose');
const Joi = require('joi');

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 16;
const BREED_MIN_LENGTH = 2;
const BREED_MAX_LENGTH = 16;

const NOTICE_CATEGORIES = {
  sell: 'sell',
  lostFound: 'lost-found',
  forFree: 'for-free',
};

const SEX_LIST = ['male', 'female'];

const NOTICE_CATEGORIES_LIST = Object.values(NOTICE_CATEGORIES);

// Mongoose schema:

const noticeSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'users',
    },
    category: {
      type: String,
      enum: NOTICE_CATEGORIES_LIST,
      required: [true, 'Category is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
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
    sex: {
      type: String,
      enum: SEX_LIST,
    },
    location: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
    },
    comments: {
      type: String,
    },
    favorites: {
      type: [{ type: Schema.Types.ObjectId, ref: 'users' }],
      default: [],
    },
  },
  { versionKey: false, timestamps: true }
);

const Notice = model('notices', noticeSchema);

// Validation schemas:

const notice = Joi.object({
  category: Joi.string()
    .required()
    .valid(...NOTICE_CATEGORIES_LIST),
  title: Joi.string().required(),
  name: Joi.string().required().min(NAME_MIN_LENGTH).max(NAME_MAX_LENGTH),
  birthday: Joi.string()
    .required()
    .pattern(/^\d{2}.\d{2}.\d{4}$/),
  breed: Joi.string().required().min(BREED_MIN_LENGTH).max(BREED_MAX_LENGTH),
  sex: Joi.string()
    .required()
    .valid(...SEX_LIST),
  location: Joi.string().required(),
  price: Joi.number().integer().positive().when('category', {
    is: NOTICE_CATEGORIES.sell,
    then: Joi.required(),
  }),
  comments: Joi.string().min(8).max(120),
});

const getQueryParams = Joi.object({
  category: Joi.string().valid(...NOTICE_CATEGORIES_LIST),
  title: Joi.string(),
  sex: Joi.string().valid(...SEX_LIST),
  location: Joi.string(),
  favorite: Joi.boolean(),
  own: Joi.boolean(),
  page: Joi.number().integer().positive(),
  limit: Joi.number().integer().positive(),
});

const updateFavorite = Joi.object({
  favorite: Joi.boolean().required(),
});

const schemas = {
  notice,
  getQueryParams,
  updateFavorite,
};

module.exports = {
  Notice,
  schemas,
};
