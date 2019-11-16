const { searchPagesByApi } = require('../../apis/wikipedia')
const { classifyImage } = require('../../apis/watson-visual-recognition')
const { WikipediaApi } = require('../../apis/wikipedia')
const prefixes = require('../input/prefixes')
const Language = require('../input/Language')
const { SuggestionService, suggestSearchTerms } = require('../input/suggestions')
const { askOption, askText } = require('../input/cli')

const MAX_SUGGESTION_COUNT = 15

const languagesToOptions = () => 
    Object.values(Language)
        .reduce((prev, x) => {
            prev[x.name] = x.code
            return prev
        }, {})

// TODO: maybe use generator for asking questions on multiple platforms

module.exports = 
async function inputRobot({ credentials }) {
    let searchTerm
    let lang
    let qtySentences
    let wikipediaApi
    while (!searchTerm) {
        lang = await askOption('language', languagesToOptions(), true)
        const suggestionService = await askOption('search type', SuggestionService)
        const suggestions = await suggestSearchTerms(suggestionService, lang, MAX_SUGGESTION_COUNT)
        if (suggestions.length) {
            searchTerm = await askOption('search term', suggestions)
        }
        else {
            switch (suggestionService) {
                case SuggestionService.WATSON_IMG_CLASSF:
                    const imagePath = await askText(`image path for ${SuggestionService.WATSON_IMG_CLASSF}`)
                    searchTerm = await classifyImage({ imagePath, watsonClassifierCredentials: credentials.watsonClassifier })
                    break
                default:
                case SuggestionService.WIKIPEDIA_SEARCH:
                    searchTerm = await askText(`${suggestionService} search term`)
                    break
            }
        }
        qtySentences = Number(await askText('number of sentences you want in your video: '))
        wikipediaApi = await askOption('Wikipedia API', WikipediaApi)

        // PREVENTS DISAMBIGUATION AND TYPOS
        if (wikipediaApi === WikipediaApi.HTTP) {
            const possiblePages = await searchPagesByApi({ searchTerm, lang })
            if (possiblePages.length) {
                searchTerm = await askOption('Wikipedia page', possiblePages.map(x => x.title))
            }
            else {
                console.log(`Nenhuma página encontrada para esta busca ("${searchTerm}").`)
                searchTerm = null
            }
        }
    }
    return {
        prefix: await askOption('prefix', prefixes),
        searchTerm,
        lang,
        wikipediaApi,
        qtySentences,
    }
}
