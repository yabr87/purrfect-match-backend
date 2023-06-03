const { Schema, model } = require('mongoose');
const Joi = require('joi');
const handleMongooseError = require('../helpers/handleMongooseError');

const { BASE_URL } = process.env;

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 16;
const NAME_LENGTH = 32;
const PHONE_LENGTH = 20;
const PHONE_PATTERN = /^\+\d{12}$/;
const PHONE_PATTERN_MESSAGE = 'Phone must start with + and contain 12 digits';
const DEFAULT_AVATAR_URL = `${BASE_URL}/avatars/avatar.jpg`;
const NEW_BALANCE_VALUE = 50;

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
      default: DEFAULT_AVATAR_URL,
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
      default: 0,
    },
    accessToken: {
      type: String,
      default: '',
    },
    refreshToken: {
      type: String,
      default: '',
    },
    otp: {
      type: String,
      default: '',
    },
    onceVerified: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
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
  lang: Joi.string().valid('ukr', 'en').default('en'),
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
  email: Joi.string().trim().lowercase().email(),
  birthday: Joi.date().iso().less('now'),
  city: Joi.string(),
  phone: Joi.string().trim().max(PHONE_LENGTH).pattern(PHONE_PATTERN).messages({
    'string.pattern.base': PHONE_PATTERN_MESSAGE,
  }),
});
// .min(1)
// .messages({ 'object.min': 'missing fields' });

const requestVerificationParams = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  lang: Joi.string().valid('ukr', 'en').default('en'),
});

const verifyParams = Joi.object({
  verificationToken: Joi.string().required(),
  otp: Joi.string().trim().required(),
});

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
  requestVerificationParams,
  verifyParams,
};

const constants = {
  DEFAULT_AVATAR_URL,
  NEW_BALANCE_VALUE,
};

module.exports = {
  User,
  schemas,
  constants,
};
