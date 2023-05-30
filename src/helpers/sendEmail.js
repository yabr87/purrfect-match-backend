const nodemailer = require('nodemailer');

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM } =
  process.env;
const nodemailerConfig = {
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
};

const defaults = {
  from: EMAIL_USER,
};

const transport = nodemailer.createTransport(nodemailerConfig, defaults);

transport.verify((err, success) => {
  if (err) {
    console.error(err.message);
  }
});

const sendEmail = async email => {
  return transport.sendMail(email);
};

module.exports = sendEmail;
