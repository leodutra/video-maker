const imdbScrapper = require('imdb-scrapper')

module.exports = {
  getImbdTrends
}

async function getImbdTrends({ maxCount = 10 } = {}) {
  console.log(`> Getting trends from IMDb (max: ${maxCount})...`)
  const movies = await imdbScrapper.getTrending(maxCount)
  return movies.trending.map(movie => movie.name)
}
