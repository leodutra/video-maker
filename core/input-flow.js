const prompts = require('prompts')
const { getGoogleTrendsFromRss, getGoogleTrendsFromApi } = require('../apis/google-trends')
const { searchPagesByApi, fetchDataByApi } = require('../apis/wikipedia')
const { getImbdTrends } = require('../apis/imdb')
const { classifyImage } = require('../apis/watson-visual-recognition')

const MAX_SUGGESTION_COUNT = 15

const optionalLangs = Object.freeze({
 'Português (BR)': 'pt-BR',
 'English (US)': 'en-US',
 'Español (ES)': 'es-ES'
})

const Suggestion = Object.freeze({
  GOOGLE_TRENDS_API: 'Google Trends(API)',
  GOOGLE_TRENDS_RSS: 'Google Trends(RSS)',
  IMDB_TRENDS: 'IMDB trends',
  WATSON_IMG_CLASSF: 'Watson - Image Classification',
  WIKIPEDIA_SEARCH: 'Wikipedia search'
})

module.exports = {
  askQuestions
}

async function askQuestions() {
  const lang = await askLanguage()
  const searchType = await askSearchType()
  const suggestions = await suggestSearchTerms(searchType, lang, MAX_SUGGESTION_COUNT)
  let searchTerm
  if (suggestions.length) {
    searchTerm = await askSuggestion('search term', suggestions)
  }
  else {
    switch (searchType) {
      case Suggestion.WATSON_IMG_CLASSF: 
        // Watson - Image Classification
        const imagePath = await askImagePath(Suggestion.WATSON_IMG_CLASSF)
        searchTerm = await classifyImage({ imagePath })
        break
      default: 
      case Suggestion.WIKIPEDIA_SEARCH:
        // Wikipedia
        searchTerm = await askTypedSearchTerm(searchType)
        const pageSuggestions = await searchPagesByApi({ searchTerm })
        searchTerm = await askSuggestion('Wikipedia page', pageSuggestions.map(x => x.title))
        break
    }
  }
  return {
    prefix: await askPrefix(),
    searchTerm,
    lang
  }
}

async function suggestSearchTerms(suggestionType, lang, maxCount) {
  console.log(`Preparing suggestions from ${suggestionType}`)
  switch (suggestionType.trim()) {
    case Suggestion.GOOGLE_TRENDS_API:
      return await getGoogleTrendsFromApi({ lang, maxCount })
    case Suggestion.GOOGLE_TRENDS_RSS:
      return await getGoogleTrendsFromRss({ lang, maxCount })
    case Suggestion.IMDB_TRENDS:
      return await getImbdTrends({ maxCount })
    default:
      return []
  }
}

async function askSearchType() {
  const { searchType } = await prompt({
    type: 'select',
    name: 'searchType',
    message: 'Choose one search type:',
    choices: valuesToChoices(Suggestion),
    validate: isValidString
  })
  return searchType
}

async function askSuggestion(subject, suggestions) {
  const { suggestion } = await prompt({
    type: 'select',
    name: 'suggestion',
    message: `Choose one suggested ${ subject || 'option' }:`,
    choices: valuesToChoices(suggestions),
    validate: isValidString
  })
  return suggestion
}

async function askImagePath(subject) {
  const { path } = await prompt({
    type: 'text',
    name: 'path',
    message: `Type the image path${ subject ? ' for ' + subject : `` }: `,
    validate: isValidString
  })
  return path
}

async function askTypedSearchTerm(searchType) {
  const { searchTerm } = await prompt({
    type: 'text',
    name: 'searchTerm',
    message: `Type a ${searchType} term: `,
    validate: isValidString
  })
  return searchTerm
}

async function askPrefix() {
  const { prefix } = await prompt({
    type: 'select',
    name: 'prefix',
    message: 'Choose one option:',
    choices: valuesToChoices(['Who is', 'What is', 'The history of']),
    validate: isValidString
  })
  return prefix
}

async function askLanguage() {
  const { language } = await prompt({
    type: 'select',
    name: 'language',
    message: 'Choose language:',
    choices: keysToChoices(optionalLangs),
    validate: isValidString
  })
  return language
}

async function prompt(...questions) {
  return new Promise((resolve, reject) => {
    const promptOptions = {
      onCancel: () => reject(new Error('The user has stopped answering'))
    }
    prompts(questions, promptOptions)
      .then(resolve)
  })
}

function isValidString(any, subject) {
  return typeof any === 'string' ? any.trim() !== '' : `Invalid ${subject || 'string'}`
}

function valuesToChoices(obj) {
  return Object.values(obj).map(v => ({ title: v, value: v }))
}

function keysToChoices(obj) {
  return Object.keys(obj).map(k => ({ title: k, value: obj[k] }))
}
