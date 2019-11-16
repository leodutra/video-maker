const { getGoogleTrendsFromRss, getGoogleTrendsFromApi } = require('../../apis/google-trends')
const { getImbdTrends } = require('../../apis/imdb')

const SuggestionService = Object.freeze({
    GOOGLE_TRENDS_API: 'Google Trends(API)',
    GOOGLE_TRENDS_RSS: 'Google Trends(RSS)',
    IMDB_TRENDS: 'IMDB trends',
    WATSON_IMG_CLASSF: 'Watson - Image Classification',
    WIKIPEDIA_SEARCH: 'Wikipedia search',
})

async function suggestSearchTerms(suggestionType, lang, maxCount) {
    console.log(`Preparing suggestions from ${suggestionType}...`)
    switch (suggestionType.trim()) {
        case SuggestionService.GOOGLE_TRENDS_API:
            return getGoogleTrendsFromApi({ lang, maxCount })
        case SuggestionService.GOOGLE_TRENDS_RSS:
            return getGoogleTrendsFromRss({ lang, maxCount })
        case SuggestionService.IMDB_TRENDS:
            return getImbdTrends({ maxCount })
        default:
            return []
    }
}

module.exports = {
    SuggestionService,
    suggestSearchTerms
}