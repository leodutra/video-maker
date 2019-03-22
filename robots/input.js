const readline = require('readline-sync')
const state = require('./state.js')
const { getGoogleTrends } = require('./google-trends')
const { getImbdTrends } = require('./imdb')

function robot() {
  const content = {
    maximumSentences: 7,
    searchTerm: askAndReturnSearchTerm(),
    prefix: askAndReturnPrefix()
  }
  state.save(content)
}

async function askAndReturnSearchTerm () {
  const response = readline.question(
`Type a Wikipedia search term OR: 
[G] to fetch Google trends 
[I] to fetch IMDB trends 
`
  )
  switch(response.trim().toUpperCase()) {
    case 'G': 
      return askAndReturnTrend(getGoogleTrends)
    case 'I':
      return askAndReturnTrend(getImbdTrends)
    default:
      return response
  }
}

function askAndReturnPrefix() {
  const prefixes = ['Who is', 'What is', 'The history of']
  const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Choose one option: ')
  const selectedPrefixText = prefixes[selectedPrefixIndex]

  return selectedPrefixText
}

async function askAndReturnTrend(suggestionGetter) {
  console.log('Please Wait...')
  const trends = await suggestionGetter()
  const choice = readline.keyInSelect(trends, 'Choose your trend:')

  return trends[choice]
}

module.exports = robot
