const { Schema, model } = require('mongoose');
const Joi = require('joi');

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 16;
const NAME_LENGTH = 32;
const PHONE_LENGTH = 20;
const PHONE_PATTERN =
  /^(\+\d{1,4}[-.\s]?)?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
const PHONE_PATTERN_MESSAGE =
  'Phone number must be digits and can contain spaces, dashes, parentheses and can start with +';

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
      type: String, //Date
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    token: {
      type: String,
      default: '',
    },
  },
  { versionKey: false, timestamps: true }
);

const User = model('users', usersSchema);

// Validation schemas:

const register = Joi.object({
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
    .messages({ 'any.required': 'missing required "password" field' }),
  confirmPassword: Joi.string().valid(Joi.ref('password')),
});

const login = Joi.object({
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

const update = Joi.object({
  name: Joi.string().trim().max(NAME_LENGTH),
  email: Joi.string().trim().lowercase().email().trim(),
  birthday: Joi.string()
    .trim()
    .pattern(/^\d{2}.\d{2}.\d{4}$/),
  city: Joi.string(),
  phone: Joi.string()
    .trim()
    .max(PHONE_LENGTH)
    .pattern(PHONE_PATTERN)
    .label('Phone')
    .messages({
      'string.pattern.base': PHONE_PATTERN_MESSAGE,
    }),
});
// .min(1)
// .messages({ 'object.min': 'missing fields' });

const schemas = {
  register,
  login,
  update,
};

module.exports = {
  User,
  schemas,
};
