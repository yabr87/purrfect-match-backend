const { Schema, model } = require('mongoose');
const Joi = require('joi');



const DaySchema = new Schema({ isOpen: Boolean, from: String, to: String });

const friendsSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    url: {
      type: String,
      required: false,
    },
    addressUrl: {
      type: Date,
      required: false,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      required: false,
    },
    workDays: {
      type: [DaySchema],
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
  },
  { versionKey: false, timestamps: true }
);

const Friends = model('friends', friendsSchema);

const friends = Joi.object({
    title: Joi.string().required(),
    url: Joi.string(),
    addressUrl: Joi.date(),
    imgUrl: Joi.string().default(''),
    address: Joi.string(),
    workDays: Joi.string(),
    phone: Joi.string(),
    email: Joi.string(),
});


const getQueryParams = Joi.object({
  page: Joi.number().integer().positive(),
  limit: Joi.number().integer().positive(),
});

const schemas = {
    friends,
    getQueryParams,
};

module.exports = {
    Friends,
  schemas,
};
