const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { ctrlWrapper, HttpError, removeFromCloud } = require('../helpers');

const { User } = require('../models/user');

const DEFAULT_AVATAR_URL = `${process.env.BASE_URL}/avatars/avatar.jpg`;
const NEW_BALANCE_VALUE = 50;

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
    balance: NEW_BALANCE_VALUE,
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

const refresh = async (req, res) => {
  const { _id: userId } = req.user;
  const user = await refreshUserToken(userId);
  const { token } = user;

  res.json({ token, user: selectUserInfo(user) });
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
    const existedUser = await User.findOne({ email: body.email });
    if (existedUser) {
      throw new HttpError(409, 'Email in use');
    }
  }

  const oldAvatarUrl = req.user.avatarUrl;

  if (file) {
    body.avatarUrl = file.path;
  }

  const user = await User.findByIdAndUpdate(userId, body, { new: true });

  if (oldAvatarUrl !== user.avatarUrl) {
    removeFromCloud(oldAvatarUrl);
  }

  res.json(selectDetailedUserInfo(user));
};

const updateAvatar = async (req, res) => {
  const { _id: userId } = req.user;
  if (!req.file) {
    throw new HttpError(400, 'Avatar is required');
  }

  const oldAvatarUrl = req.user.avatarUrl;

  const newAvatarUrl = req.file.path;
  const { avatarUrl } = await User.findByIdAndUpdate(
    userId,
    { avatarUrl: newAvatarUrl },
    { new: true }
  );

  removeFromCloud(oldAvatarUrl);

  res.json({
    avatarUrl,
  });
};

// Utils:

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
  balance: user.balance,
});

const setUserToken = async (userId, token) =>
  User.findByIdAndUpdate(userId, { token }, { new: true });

const removeUserToken = userId => setUserToken(userId, '');

const refreshUserToken = async userId => {
  const tokenPayload = { id: userId };
  const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, {
    expiresIn: '50h',
  });

  return setUserToken(userId, token);
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  logout: ctrlWrapper(logout),
  refresh: ctrlWrapper(refresh),
  getCurrent: ctrlWrapper(getCurrent),
  updateCurrent: ctrlWrapper(updateCurrent),
  updateAvatar: ctrlWrapper(updateAvatar),
};
