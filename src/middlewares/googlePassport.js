const passport = require('passport');
const { Strategy } = require('passport-google-oauth2');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { User, constants } = require('../models/user');

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BASE_URL } = process.env;

const googleParams = {
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: `${BASE_URL}/api/users/google/callback`,
  passReqToCallback: true,
};

const googleCallback = async (
  req,
  accessToken,
  refreshToken,
  profile,
  done
) => {
  try {
    const {
      email,
      displayName: name = 'User',
      picture: avatarUrl = constants.DEFAULT_AVATAR_URL,
      email_verified: verified,
    } = profile;
    const user = await User.findOne({ email });
    if (user) {
      return done(null, user);
    }
    const password = await bcrypt.hash(
      crypto.randomBytes(50).toString('base64'),
      10
    );
    const newUser = (
      await User.create({
        email,
        password,
        avatarUrl,
        name,
        verified,
        balance: verified ? constants.NEW_BALANCE_VALUE : 0,
      })
    ).toObject();
    newUser.isNewUser = true;
    done(null, newUser);
  } catch (error) {
    done(error, false);
  }
};

const googleStrategy = new Strategy(googleParams, googleCallback);

passport.use('google', googleStrategy);

module.exports = passport;
