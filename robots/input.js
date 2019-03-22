const readline = require('readline-sync')
const state = require('./state.js')
const { askAndReturnTrend } = require('./google-trends')

function robot() {
  const content = {
    maximumSentences: 7,
    searchTerm: askAndReturnSearchTerm(),
    prefix: askAndReturnPrefix()
  }
  state.save(content)
}

async function askAndReturnSearchTerm () {
  const response = readline.question('Type a Wikipedia search term or G to fetch google trends: ')
  return response.toUpperCase() === 'G' ?  await askAndReturnTrend() : response
}

function askAndReturnPrefix() {
  const prefixes = ['Who is', 'What is', 'The history of']
  const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Choose one option: ')
  const selectedPrefixText = prefixes[selectedPrefixIndex]

  return selectedPrefixText
}

module.exports = robot
