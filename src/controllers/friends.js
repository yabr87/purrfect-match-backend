const { ctrlWrapper } = require('../helpers');
const { Friends } = require('../models/friends');

const getFriends = async (req, res) => {
    const { page = 1, limit = 9 } = req.query;
    const skip = (page - 1) * limit;
    const results = await Friends.find({}, null, {
      skip,
      limit
    }).lean();
      
    const totalResults = await Friends.count().lean();
    res.json({
      totalResults,
      results, 
      page,
      totalPages: Math.ceil(totalResults / limit)
    });
  };
  
  module.exports = {
    getFriends: ctrlWrapper(getFriends),
  };
  