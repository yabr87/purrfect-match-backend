const path = require('path');
const fs = require('fs/promises');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Jimp = require('jimp');

const { ctrlWrapper, HttpError } = require('../helpers');

const { User } = require('../models/user');

const DEFAULT_AVATAR_URL = `${process.env.BASE_URL}/avatars/avatar.jpg`;
const AVATAR_SIZE = 250;
const avatarsDir = path.resolve('public', 'avatars');

// Controllers:

const register = async (req, res) => {
  const { body } = req;
  const { email, password } = body;
  let user = await User.findOne({ email });

  if (user) {
    throw new HttpError(409, 'Email in use');
  }

  const hashPassword = await bcrypt.hash(password, 10);
  user = await User.create({
    ...body,
    avatarUrl: DEFAULT_AVATAR_URL,
    password: hashPassword,
  });

  user = await refreshUserToken(user._id);
  const { token } = user;

  res.status(201).json({ token, user: selectUserInfo(user) });
};

const login = async (req, res) => {
  const { body } = req;
  const { email, password } = body;
  let user = await User.findOne({ email });
  if (!user) {
    throw new HttpError(401, 'Email or password is wrong');
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    throw new HttpError(401, 'Email or password is wrong');
  }

  user = await refreshUserToken(user._id);
  const { token } = user;

  res.json({ token, user: selectUserInfo(user) });
};

const logout = async (req, res) => {
  await removeUserToken(req.user._id);
  res.status(204).send();
};

const getCurrent = async (req, res) => {
  res.json(selectDetailedUserInfo(req.user));
};

const updateCurrent = async (req, res) => {
  const { _id: userId } = req.user;
  const { body, file } = req;

  if (Object.keys(body).length === 0 && !file) {
    throw new HttpError(400, 'Missing fields');
  }

  if (body.email) {
    const existedUser = await User.fileOne({ email: email });
    if (existedUser) {
      throw new HttpError(409, 'Email in use');
    }
  }

  if (file) {
    body.avatarUrl = await storeAvatar(userId, file);
  }

  const user = await User.findByIdAndUpdate(userId, body, { new: true });
  res.json(selectDetailedUserInfo(user));
};

const updateAvatar = async (req, res) => {
  const { _id: userId } = req.user;
  if (!req.file) {
    throw new HttpError(400, 'Avatar is required');
  }
  const newAvatarUrl = await storeAvatar(userId, req.file);
  const { avatarUrl } = await User.findByIdAndUpdate(
    userId,
    { avatarUrl: newAvatarUrl },
    { new: true }
  );

  res.json({
    avatarUrl,
  });
};

// Utils:

const storeAvatar = async (userId, file) => {
  if (!file) {
    return null;
  }

  const { path: tempUpload, mimetype } = file;

  const extention = mimetype?.split('/')[1];
  const newExtention = extention !== 'png' ? 'jpg' : 'png';
  const filename = `${userId}.${newExtention}`;

  try {
    const resultUpload = path.join(avatarsDir, filename);
    const avatarImage = await Jimp.read(tempUpload);
    await avatarImage
      .cover(AVATAR_SIZE, AVATAR_SIZE)
      .quality(75)
      .writeAsync(resultUpload);
  } finally {
    await fs.unlink(tempUpload);
  }
  const { BASE_URL, PORT } = process.env;
  const avatarUrl = `${BASE_URL}:${PORT}/avatars/${filename}`;
  return avatarUrl;
};

const selectUserInfo = user => ({
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
});

const selectDetailedUserInfo = user => ({
  name: user.name,
  email: user.email,
  birthday: user.birthday,
  city: user.city,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
});

const setUserToken = async (userId, token) =>
  User.findByIdAndUpdate(userId, { token }, { new: true });

const removeUserToken = userId => setUserToken(userId, '');

const refreshUserToken = async userId => {
  const tokenPayload = { id: userId };
  const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, {
    expiresIn: '23h',
  });

  return setUserToken(userId, token);
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  logout: ctrlWrapper(logout),
  getCurrent: ctrlWrapper(getCurrent),
  updateCurrent: ctrlWrapper(updateCurrent),
  updateAvatar: ctrlWrapper(updateAvatar),
};
