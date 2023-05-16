const { ctrlWrapper } = require('../helpers');

const { News } = require('../models/news');

const getNews = async (req, res) => {
  const { page = 1, limit = 6, search } = req.query;
  const skip = (page - 1) * limit;

  const query = search
    ? {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const hits = await News.find(query, null, {
    skip,
    limit,
    sort: {
      date: -1,
    },
  }).lean();

  const totalResults = await News.count(query).lean();

  res.json({
    totalResults,
    page,
    totalPages: Math.ceil(totalResults / limit),
    results: hits,
  });
};

module.exports = {
  getNews: ctrlWrapper(getNews),
};
