const googleTrends = require('google-trends-api')
const RssParser = require('rss-parser')

module.exports = {
  getGoogleTrendsFromRss,
  getGoogleTrendsFromApi
}

async function getGoogleTrendsFromRss({ lang, maxCount = 10 }) {
  console.log(`> Getting Google trends from RSS (language: ${lang} - max: ${maxCount})...`)
  const geo = extractLanguageGeoCode(lang)
  const rssParser = new RssParser()
  const trends = await rssParser.parseURL(
    `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`
  )
  return trends.items.map(trend => trend.title)
    .slice(0, maxCount + 1)
}

async function getGoogleTrendsFromApi({ lang, maxCount = 10 }) {
  console.log(`> Getting Google trends from API (language: ${lang} - max: ${maxCount})...`)
  const trendsSettings = {
    trendDate: new Date(),
    geo: extractLanguageGeoCode(lang),
    hl: lang
  }
  const results = await googleTrends.realTimeTrends(trendsSettings)
  const trendingStories = JSON.parse(results).storySummaries.trendingStories
  return trendingStories.map(story => story.entityNames[0])
    .slice(0, maxCount + 1)
}

function extractLanguageGeoCode(lang) {
  const parts = lang.split('-')
  return parts[parts.length - 1]
}