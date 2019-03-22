const imdbScrapper = require('imdb-scrapper')

async function getImbdTrends(maxCount = 10) {
  const movies = await imdbScrapper.getTrending(maxCount)
  return movies.trending.map(movie => movie.name)
}

module.exports = {
  getImbdTrends
}