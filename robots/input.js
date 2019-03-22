const readlineSync = require('readline-sync')
const state = require('./state.js')
const { getGoogleTrendsFromRss, getGoogleTrendsFromApi } = require('./google-trends')
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
  const response = readlineSync.question(
`Type a Wikipedia search term OR: 
[G] to fetch Google trends from API
[GR] to fetch Google trends from RSS
[I] to fetch IMDB trends 
`
  )
  console.log('Please Wait...')
  switch(response.trim().toUpperCase()) {
    case 'G': 
      return askAndReturnOption('Google trend', await getGoogleTrendsFromApi())
    case 'GR': 
      return askAndReturnOption('Google trend', await getGoogleTrendsFromRss())
    case 'I':
      return askAndReturnOption('IMDB trend', await getImbdTrends())
    default:
      return response
  }
}

function askAndReturnPrefix() {
  const prefixes = ['Who is', 'What is', 'The history of']
  const selectedPrefixIndex = readlineSync.keyInSelect(prefixes, 'Choose one option: ')
  const selectedPrefixText = prefixes[selectedPrefixIndex]

  return selectedPrefixText
}

function askAndReturnOption(optionType, suggestions) {
  const choice = readlineSync.keyInSelect(suggestions, `Choose your ${optionType}:`)
  return suggestions[choice]
}

module.exports = robot
