const { Schema, model } = require('mongoose');
const Joi = require('joi');
const handleMongooseError = require('../helpers/handleMongooseError');

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 16;
const NAME_LENGTH = 32;
const PHONE_LENGTH = 20;
const PHONE_PATTERN = /^\+\d{12}$/;
const PHONE_PATTERN_MESSAGE = 'Phone must start with + and contain 12 digits';

// Mongoose schema:

const usersSchema = new Schema(
  {
    name: {
      type: String,
      default: 'User',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    avatarUrl: {
      type: String,
      required: [true, 'Avatar URL is required'],
    },
    birthday: {
      type: Date,
      default: null,
    },
    city: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    balance: {
      type: Number,
    },
    accessToken: {
      type: String,
      default: '',
    },
    refreshToken: {
      type: String,
      default: '',
    },
  },
  { versionKey: false, timestamps: true }
);

usersSchema.post('save', handleMongooseError);

const User = model('users', usersSchema);

// Validation schemas:

const registerParams = Joi.object({
  email: Joi.string()
    .required()
    .trim()
    .lowercase()
    .email()
    .messages({ 'any.required': 'missing required "email" field' }),
  password: Joi.string()
    .required()
    .min(PASSWORD_MIN_LENGTH)
    .max(PASSWORD_MAX_LENGTH)
    .pattern(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)
    .messages({ 'any.required': 'missing required "password" field' }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).strip(),
});

const loginParams = Joi.object({
  email: Joi.string()
    .required()
    .trim()
    .lowercase()
    .email()
    .messages({ 'any.required': 'missing required "email" field' }),
  password: Joi.string()
    .required()
    .messages({ 'any.required': 'missing required "password" field' }),
});

const refreshParams = Joi.object({
  refreshToken: Joi.string().required(),
});

const updateParams = Joi.object({
  name: Joi.string().trim().max(NAME_LENGTH),
  email: Joi.string().trim().lowercase().email().trim(),
  birthday: Joi.date().iso().less('now'),
  city: Joi.string(),
  phone: Joi.string().trim().max(PHONE_LENGTH).pattern(PHONE_PATTERN).messages({
    'string.pattern.base': PHONE_PATTERN_MESSAGE,
  }),
});
// .min(1)
// .messages({ 'object.min': 'missing fields' });

const avatarConfig = {
  field: 'avatar',
  folder: 'avatars',
  // transformation: [{ width: 180, height: 180, crop: 'fill' }],
};

const schemas = {
  registerParams,
  loginParams,
  refreshParams,
  updateParams,
  avatarConfig,
};

module.exports = {
  User,
  schemas,
};
