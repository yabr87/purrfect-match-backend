const { ctrlWrapper, HttpError } = require('../helpers');
const { Friends } = require('../models/friends');

const getFriends = async (req, res) => {
    const { page = 1, limit = 9 } = req.query;
    const skip = (page - 1) * limit;
    const hits = await Friends.find({}, null, {
      skip,
      limit,
      sort: {
        date: -1,
      },
    }).lean();

    if (!hits) {
      throw new HttpError(404, `Our  friends  not found`);
    }

    const totalHits = await Friends.count().lean();
    res.json({ totalHits, hits });
  };
  
  module.exports = {
    getFriends: ctrlWrapper(getFriends),
  };
  