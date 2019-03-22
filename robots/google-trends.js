const Parser = require('rss-parser')

const TREND_URL = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=BR' 

async function getGoogleTrends() {
    const parser = new Parser()
    const trends = await parser.parseURL(TREND_URL)
    return trends.items.map(trend => trend.title)
}

module.exports = {
  getGoogleTrends
}