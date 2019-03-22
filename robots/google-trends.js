const googleTrends = require('google-trends-api')
const RssParser = require('rss-parser')

const TREND_RSS_URL = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=BR' 

async function getGoogleTrendsFromRss(maxCount = 10) {
  const rssParser = new RssParser()
  const trends = await rssParser.parseURL(TREND_RSS_URL)
  return trends.items.map(trend => trend.title)
    .slice(0, maxCount - 1 || 1)
}

async function getGoogleTrendsFromApi(maxCount) {
  const trendsSettings = {
    trendDate: new Date(),
    geo: 'BR',
    hl: "pt-BR"
  }
  const results = await googleTrends.realTimeTrends(trendsSettings)
  const trendingStories = JSON.parse(results).storySummaries.trendingStories
  return trendingStories.map(story => story.entityNames)
    .slice(0, maxCount - 1 || 1)
}

module.exports = {
  getGoogleTrendsFromRss,
  getGoogleTrendsFromApi
}
