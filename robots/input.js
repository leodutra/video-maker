const readlineSync = require('readline-sync')
const prompts = require('prompts')  
const state = require('./state.js')
const { getGoogleTrendsFromRss, getGoogleTrendsFromApi } = require('./google-trends')
const { getImbdTrends } = require('./imdb')

const Suggestions = {
  GOOGLE_TRENDS_API: 'Google Trends(API)',
  GOOGLE_TRENDS_RSS: 'Google Trends(RSS)',
  IMDB_TRENDS: 'IMDB trends',
  WIKIPEDIA: 'Wikipedia'
}

function robot() {
  const content = {
    maximumSentences: 7,
    ...askAndReturnAnswers()
  }
  state.save(content)
}

async function askAndReturnAnswers() {
  const { suggestionType } = await askQuestions({
    type: 'select',
    name: 'suggestionType',
    message: 'Choose one search term:',
    choices: Object.values(Suggestions),
    validate: isValidString
  })
  const suggestions = suggestSearchTerms(suggestionType)
  let searchTerm
  if (suggestions.length) {
    const answer = await askQuestions({
      type: 'select',
      name: 'searchTerm',
      message: 'Choose one search term:',
      choices: suggestions,
      validate: isValidString
    })
    searchTerm = answer.searchTerm
  }
  else {
    const searchTerm = readlineSync.question('Type a Wikipedia search term: ')
    if (!isValidString(searchTerm)) throw new Error(`Invalid Wikipedia search term`)
  }
  const { prefix } = askQuestions({
    type: 'select',
    name: 'prefix',
    message: 'Choose one option:',
    choices: ['Who is', 'What is', 'The history of'],
    validate: isValidString
  })
  return {
    searchTerm,
    prefix
  }
}

async function askQuestions(...questions) {
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
  switch(suggestionType.trim()) {
    case Suggestions.GOOGLE_TRENDS_API: 
      return await getGoogleTrendsFromApi()
    case Suggestions.GOOGLE_TRENDS_RSS: 
      return await getGoogleTrendsFromRss()
    case Suggestions.IMDB_TRENDS:
      return await getImbdTrends()
    default:
    case Suggestions.WIKIPEDIA:
      return []
  }
}

module.exports = robot
