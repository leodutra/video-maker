const Parser = require('rss-parser')

const TREND_URL = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=BR' 

async function askAndReturnTrend() {
    console.log('Please Wait...')
    const trends = await getGoogleTrends()
    const choice = readline.keyInSelect(trends, 'Choose your trend:')

    return trends[choice]
}
  
async function getGoogleTrends () {
    const parser = new Parser()
    const trends = await parser.parseURL(TREND_URL)
    return trends.items.map(trend => trend.title)
}

module.exports = {
    askAndReturnTrend,
    getGoogleTrends
}