const state = require('./core/state')
const { askQuestions } = require('./core/input')
const { produceText }  = require('./core/text')
const { searchTextImages }  = require('./core/image')

async function start() {
  const {
    searchTerm,
    prefix
  } = await askQuestions()
  const sentences = await produceText({ searchTerm, maxSentences: 7 })
  const hypertext = await searchTextImages({ searchTerm, sentences })

  console.log(JSON.stringify(hypertext, null, 4))
}

start();
