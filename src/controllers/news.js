const { ctrlWrapper } = require('../helpers');

const { News } = require('../models/news');

const getNews = async (req, res) => {
  const { page = 1, limit = 6 } = req.query;
  const skip = (page - 1) * limit;
  const hits = await News.find({}, null, {
    skip,
    limit,
    sort: {
      date: -1,
    },
  }).lean();

  const totalHits = await News.count().lean();
  res.json({ totalHits, hits });
};

module.exports = {
  getNews: ctrlWrapper(getNews),
};
