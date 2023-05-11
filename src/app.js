const express = require('express');
const logger = require('morgan');
const cors = require('cors');

const authRouter = require('./routes/api/auth');

const { HttpError } = require('./helpers');

const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/users', authRouter);

app.use((req, res, next) => {
  next(new HttpError(404));
});

app.use((err, req, res, next) => {
  const { status = 500, message = 'Server error' } = err;
  res.status(status).json({ message });
});

module.exports = app;
