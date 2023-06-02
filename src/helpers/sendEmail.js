const nodemailer = require('nodemailer');

const { EMAIL_USER, EMAIL_PASSWORD } = process.env;
const nodemailerConfig = {
  service: 'gmail',
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
