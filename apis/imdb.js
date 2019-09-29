const imdbScrapper = require('imdb-scrapper')

module.exports = {
    getImbdTrends
}

async function getImbdTrends({ maxCount = 10 } = {}) {
    console.log(`> Getting trends from IMDb (max: ${maxCount})...`)
    return (await imdbScrapper.getTrending(maxCount))
        .trending.map(movie => movie.name)
}
