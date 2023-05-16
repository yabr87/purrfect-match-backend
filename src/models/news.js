const { Schema, model } = require('mongoose');
const Joi = require('joi');

const newsSchema = new Schema(
  {
    imgUrl: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    text: {
      type: String,
      required: [true, 'Text is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
    },
    id: {
      type: String,
    },
  },
  { versionKey: false, timestamps: true }
);

const News = model('news', newsSchema);

const news = Joi.object({
  imgUrl: Joi.string().default(''),
  title: Joi.string().required(),
  text: Joi.string().required(),
  date: Joi.date().required(),
  url: Joi.string().required(),
  id: Joi.string(),
});
// може буде потрібна на всякий випадок

const getQueryParams = Joi.object({
  page: Joi.number().integer().positive().empty(''),
  limit: Joi.number().integer().positive().empty(''),
  search: Joi.string().empty(''),
});

const schemas = {
  news,
  getQueryParams,
};

module.exports = {
  News,
  schemas,
};
