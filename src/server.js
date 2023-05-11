require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');

const { PORT = 3001, DB_HOST, BASE_URL } = process.env;

mongoose
  .connect(DB_HOST)
  .then(() => {
    console.log('Database connection successful');
    app.listen(PORT, () => {
      console.log(`Server running. Use our API on: ${BASE_URL}:${PORT}`);
    });
  })
  .catch(err => {
    console.log(`Server not running. Error message: \n${err.message}`);
    process.exit(1);
  });
