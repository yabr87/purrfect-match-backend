const getRating = increaseRating => {
  let rating = Date.now();
  if (increaseRating) {
    rating = rating + 86400000 * increaseRating;
    return rating;
  }
  return rating;
};

module.exports = { getRating };
