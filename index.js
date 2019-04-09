const state = require('./core/state')
const { askQuestions } = require('./core/input-flow')
const { produceText }  = require('./core/text-flow')
const { produceImages }  = require('./core/image-flow')

async function start() {
  const {
    searchTerm,
    prefix,
    lang,
    wikipediaApi
  } = await askQuestions()
  const sentences = await produceText({ searchTerm, maxSentences: 7, lang, wikipediaApi })
  const hypertext = await produceImages({ searchTerm, sentences })

  console.log(JSON.stringify(hypertext, null, 4))
}

start();
