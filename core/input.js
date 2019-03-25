const readlineSync = require('readline-sync')
const prompts = require('prompts')
const { getGoogleTrendsFromRss, getGoogleTrendsFromApi } = require('../apis/google-trends')
const { searchPagesByApi, fetchDataByApi } = require('../apis/wikipedia')
const { getImbdTrends } = require('../apis/imdb')
const { classifyImage } = require('../apis/watson-visual-recognition')

const Suggestion = {
  GOOGLE_TRENDS_API: 'Google Trends(API)',
  GOOGLE_TRENDS_RSS: 'Google Trends(RSS)',
  IMDB_TRENDS: 'IMDB trends',
  IMAGE: 'Image',
  WIKIPEDIA: 'Wikipedia'
}

async function askQuestions() {
  return {
    maximumSentences: 7,
    ...await askAndReturnAnswers()
  }
}

async function askAndReturnAnswers() {
  let { searchType } = await question({
    type: 'select',
    name: 'searchType',
    message: 'Choose one search type:',
    choices: valuesToChoice(Suggestion),
    validate: isValidString
  })
  const suggestions = await suggestSearchTerms(searchType)
  let searchTerm
  if (suggestions.length) {
    const answer = await question({
      type: 'select',
      name: 'searchTerm',
      message: 'Choose one search term:',
      choices: valuesToChoice(suggestions),
      validate: isValidString
    })
  }
  else {
    switch (searchType) {
      case Suggestion.IMAGE: // WATSON
        const imagePath = readline.question('Type the image path: ')
        searchTerm = await classifyImage(imagePath)
        break
      default: // WIKIPEDIA
        searchTerm = readlineSync.question(`Type a ${searchType} term: `)
        if (!isValidString(searchTerm)) throw new Error(`Invalid ${searchType} search term`)
        console.log('Searching possible Wikipedia pages...')
        const pageSuggestions = searchPagesByApi(searchTerm)
        searchTerm = readline.keyInSelect(pageSuggestions.map(x => x.title),'Choose if any of these keys is the desired search: ')
        break
    }
  }
  const { prefix } = await question({
    type: 'select',
    name: 'prefix',
    message: 'Choose one option:',
    choices: valuesToChoice(['Who is', 'What is', 'The history of']),
    validate: isValidString
  })
  return {
    searchTerm,
    prefix
  }
}

async function question(...questions) {
  return new Promise((resolve, reject) => {
    const promptOptions = {
      onCancel: () => reject(new Error('The user has stopped answering'))
    }
    prompts(questions, promptOptions)
      .then(resolve)
  })
}

function isValidString(any) {
  return typeof any === 'string' ? any.trim() !== '' : false
}

async function suggestSearchTerms(suggestionType) {
  switch (suggestionType.trim()) {
    case Suggestion.GOOGLE_TRENDS_API:
      return await getGoogleTrendsFromApi()
    case Suggestion.GOOGLE_TRENDS_RSS:
      return await getGoogleTrendsFromRss()
    case Suggestion.IMDB_TRENDS:
      return await getImbdTrends()
    default:
      return []
  }
}

function valuesToChoice(obj) {
  return Object.values(obj).map( x => ({ title: x, value: x}))
}

module.exports = {
  askQuestions
}
