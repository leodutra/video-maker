const imdbScrapper = require('imdb-scrapper')

function getImbdTrends(how_many = 10) {
  return imdbScrapper
    .getTrending(how_many)
    .then(movies => movies.trending.map(movie => movie.name))
}

module.exports = {
  getImbdTrends
}