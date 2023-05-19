const { Schema, model } = require('mongoose');
const Joi = require('joi');
const handleMongooseError = require('../helpers/handleMongooseError');

const TITLE_MIN_LENGTH = 4;
const TITLE_MAX_LENGTH = 60;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 16;
const BREED_MIN_LENGTH = 2;
const BREED_MAX_LENGTH = 16;
const COMMENTS_MIN_LENGTH = 0;
const COMMENTS_MAX_LENGTH = 120;

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
    sex: {
      type: String,
      enum: SEX_LIST,
      required: [true, 'Pet gender is required'],
    },
    location: {
      type: String,
      required: [true, 'Pet location is required'],
    },
    price: {
      type: Number,
    },
    comments: {
      type: String,
      default: '',
    },
    favorites: {
      type: [{ type: Schema.Types.ObjectId, ref: 'users' }],
      default: [],
    },
  },
  { versionKey: false, timestamps: true }
);

noticeSchema.post('save', handleMongooseError);

const Notice = model('notices', noticeSchema);

// Validation schemas:

const customJoi = Joi.extend(Joi => ({
  base: Joi.array(),
  type: 'stringArray',
  coerce: value => ({ value: value?.split(',') ?? [] }),
}));

const addParams = Joi.object({
  category: Joi.string()
    .required()
    .valid(...NOTICE_CATEGORIES_LIST),
  title: Joi.string().min(TITLE_MIN_LENGTH).max(TITLE_MAX_LENGTH).required(),
  name: Joi.string().required().min(NAME_MIN_LENGTH).max(NAME_MAX_LENGTH),
  birthday: Joi.date().iso().less('now').required(),
  breed: Joi.string().required().min(BREED_MIN_LENGTH).max(BREED_MAX_LENGTH),
  sex: Joi.string()
    .required()
    .valid(...SEX_LIST),
  location: Joi.string().required(),
  price: Joi.number().integer().positive().when('category', {
    is: NOTICE_CATEGORIES.sell,
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  comments: Joi.string().min(COMMENTS_MIN_LENGTH).max(COMMENTS_MAX_LENGTH),
});

const getParams = Joi.object({
  category: Joi.string()
    .valid(...NOTICE_CATEGORIES_LIST)
    .empty(''),
  title: Joi.string().empty(''),
  sex: Joi.string()
    .valid(...SEX_LIST)
    .empty(''),
  location: Joi.string().empty(''),
  age: customJoi.stringArray().items(Joi.number(), Joi.strip()).max(5).sparse(),
  favorite: Joi.boolean().empty(''),
  own: Joi.boolean().empty(''),
  page: Joi.number().integer().min(1).empty(''),
  limit: Joi.number().integer().min(1).max(100).empty(''),
});

const updateFavoriteParams = Joi.object({
  favorite: Joi.boolean().required(),
});

const photoConfig = {
  field: 'photo',
  folder: 'notices',
  // transformation: [{ width: 340, height: 340, crop: 'fill' }],
};

const schemas = {
  addParams,
  getParams,
  updateFavoriteParams,
  photoConfig,
};

module.exports = {
  Notice,
  schemas,
};
