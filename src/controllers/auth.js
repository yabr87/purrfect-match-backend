const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const {
  ctrlWrapper,
  HttpError,
  removeFromCloud,
  sendEmail,
} = require('../helpers');

const verificationEmail = require('../templates/verificationEmail');

const { User } = require('../models/user');

const { ACCESS_SECRET_KEY, REFRESH_SECRET_KEY, FRONTEND_URL } = process.env;

// Controllers:

const register = async (req, res) => {
  const { body } = req;
  const { email, password, lang } = body;
  let user = await User.findOne({ email });

  if (user) {
    throw new HttpError(409, 'Email in use');
  }

  const hashPassword = await bcrypt.hash(password, 10);
  user = await User.create({
    ...body,
    password: hashPassword,
  });

  user = await refreshUserToken(user._id);
  const { accessToken, refreshToken } = user;
  const verificationToken = await sendVerificationEmail(user, lang);
  res.status(201).json({
    accessToken,
    refreshToken,
    verificationToken,
    user: selectUserInfo(user),
  });
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
  const { accessToken, refreshToken } = user;

  res.json({ accessToken, refreshToken, user: selectUserInfo(user) });
};

const googleAuth = async (req, res) => {
  const { _id: userId, isNewUser } = req.user;
  const { accessToken, refreshToken } = await refreshUserToken(userId);

  res.redirect(
    `${FRONTEND_URL}?accessToken=${accessToken}&refreshToken=${refreshToken}${
      isNewUser ? '&newUser=true' : ''
    }`
  );
};

const requestVerification = async (req, res) => {
  const { email, lang } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.verified) {
    throw new HttpError(400, "Email isn't registered or unverified");
  }

  const verificationToken = await sendVerificationEmail(user, lang);
  res.json({ verificationToken });
};

const verify = async (req, res) => {
  const verified = await verifyOtp(req.body);

  res.json({ verified });
};

const verifyAndRedirect = async (req, res) => {
  let message = null;
  try {
    const verified = await verifyOtp(req.query);
    message = verified
      ? 'Email successfully verified'
      : 'Email verification failed';
  } catch (error) {
    message = error.message;
  }
  res.redirect(`${FRONTEND_URL}?message=${message}`);
};

const logout = async (req, res) => {
  await removeUserToken(req.user._id);
  res.status(204).send();
};

const refresh = async (req, res) => {
  const { body } = req;
  try {
    const { id } = jwt.verify(body.refreshToken, REFRESH_SECRET_KEY);
    let user = await User.findById(id, 'refreshToken');
    if (!user || user.refreshToken !== body.refreshToken) {
      throw new HttpError(403, 'Invalid refresh token');
    }

    user = await refreshUserToken(id);
    const { accessToken, refreshToken } = user;

    res.json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    throw new HttpError(403, 'Invalid refresh token');
  }
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
    body.verified = false;
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
  verified: user.verified,
});

const setUserToken = async (userId, accessToken, refreshToken) =>
  User.findByIdAndUpdate(userId, { accessToken, refreshToken }, { new: true });

const removeUserToken = userId => setUserToken(userId, '', '');

const refreshUserToken = async userId => {
  const tokenPayload = { id: userId };
  const accessToken = jwt.sign(tokenPayload, ACCESS_SECRET_KEY, {
    expiresIn: '5m',
  });
  const refreshToken = jwt.sign(tokenPayload, REFRESH_SECRET_KEY, {
    expiresIn: '7d',
  });

  return setUserToken(userId, accessToken, refreshToken);
};

const verifyOtp = async ({ verificationToken, otp }) => {
  let id = null;
  try {
    id = jwt.verify(verificationToken, ACCESS_SECRET_KEY).id;
  } catch {
    throw new HttpError(400, 'Invalid or expired verificationToken');
  }
  const user = await User.findByIdAndUpdate(id, { otp: '' });
  if (!user) {
    throw new HttpError(400, "User wasn't fount");
  }

  const isOtpValid = user.otp && (await bcrypt.compare(otp, user.otp));
  if (!isOtpValid) {
    throw new HttpError(400, 'Wrong password');
  }

  user.verified = true;
  const { verified } = await user.save();
  return verified;
};

const sendVerificationEmail = async (user, lang) => {
  const otp = crypto.randomInt(1000000).toString().padStart(6, '0');
  // or something like this:
  // const otp = crypto.randomBytes(4).toString('base64url');
  const hashedOpt = await bcrypt.hash(otp, 10);
  user.otp = hashedOpt;
  await user.save();
  const tokenPayload = { id: user._id };
  const verificationToken = jwt.sign(tokenPayload, ACCESS_SECRET_KEY, {
    expiresIn: '5m',
  });
  const validUntil = new Date(jwt.decode(verificationToken).exp * 1000);
  const emailMessage = verificationEmail(
    user.email,
    lang,
    verificationToken,
    otp,
    validUntil
  );
  await sendEmail(emailMessage);

  return verificationToken;
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  googleAuth: ctrlWrapper(googleAuth),
  requestVerification: ctrlWrapper(requestVerification),
  verify: ctrlWrapper(verify),
  verifyAndRedirect: ctrlWrapper(verifyAndRedirect),
  logout: ctrlWrapper(logout),
  refresh: ctrlWrapper(refresh),
  getCurrent: ctrlWrapper(getCurrent),
  updateCurrent: ctrlWrapper(updateCurrent),
  updateAvatar: ctrlWrapper(updateAvatar),
};
