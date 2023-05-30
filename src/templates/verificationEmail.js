const { format } = require('date-fns');
const { en, uk } = require('date-fns/locale');

const { BASE_URL, FRONTEND_URL } = process.env;

const verificationEmail = (email, lang, ...params) => {
  return {
    to: email,
    subject: 'Verify email',
    html: htmlTemplate[lang](...params),
  };
};

const htmlTemplate = {
  en: (verificationToken, otp, validUntil) => `
    <h1>Email verification</h1>
    <p>This email was generated automatically to verify your email address. You don't need to reply.'</p>
    <p>To verify your email address you have three options:</p>
    <ol>
      <li><a target="_blank" href="${BASE_URL}/api/users/verify?verificationToken=${verificationToken}&otp=${otp}">Click here and proceed to the backend. Then your email will be verified and you will be redirected to the Purrfect-match website.</a></li>
      <li><a target="_blank" href="${FRONTEND_URL}/api/users/verify?verificationToken=${verificationToken}&otp=${otp}">Сlick here and proceed to the Purrfect-match website. Then request to verify your email will be sent'</a></li>
      <li>You can copy this one time password <b>${otp}</b> into a corresponding field on the website</li>
    </ol>
    <p>Make a note, this email is valid until ${format(validUntil, 'PPpp', {
      locale: en,
    })}</p>`,
  ukr: (verificationToken, otp, validUntil) => `
    <h1>Верифікація пошти</h1>
    <p>Цей лист було сгенеровано автоматично, щоб верифікувату вашу поштову скриньку. Вам непотрібно відповідати.</p>
    <p>У вас є три способи верифікувати вашу пошту:</p>
    <ol>
      <li><a target="_blank" href="${BASE_URL}/api/users/verify?verificationToken=${verificationToken}&otp=${otp}">Натисніть сюди та перейдіть до бекенду. Потім ваша пошта буде верифікована та вас перенаправить на сайт Purrfect-match.</a></li>
      <li><a target="_blank" href="${FRONTEND_URL}/api/users/verify?verificationToken=${verificationToken}&otp=${otp}">Натисніть сюди та перейдіть на сайт Purrfect-match. Потім буде відправлено запит для підтвердження вашої пошти.'</a></li>
      <li>Ви можете скопіювати цей одноразовий пароль <b>${otp}</b> у відповідне поле на сайті</li>
    </ol>
    <p>Майте на увазі, цей лист дійсний до
    ${format(validUntil, 'PPpp', { locale: uk })}</p>`,
};

module.exports = verificationEmail;
