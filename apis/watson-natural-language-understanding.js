
const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')

const nlu = new NaturalLanguageUnderstandingV1({
  iam_apikey: watsonApiKey,
  version: '2018-04-05',
  url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
})

async function fetchWatsonKeywords(sentence) {
  return new Promise((resolve, reject) => {
    nlu.analyze({
      text: sentence,
      features: {
        keywords: {}
      }
    }, (error, response) => {
      if (error) {
        return reject(error)
      }

      const keywords = response.keywords.map(keyword => keyword.text)
      resolve(keywords)
    })
  })
}

module.exports = {
  fetchWatsonKeywords
}