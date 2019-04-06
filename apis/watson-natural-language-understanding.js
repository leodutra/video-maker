
const watsonNluConfig = require('../credentials/watson-nlu.json')
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')

const nlu = new NaturalLanguageUnderstandingV1({
  iam_apikey: watsonNluConfig.apikey,
  version: '2018-04-05',
  url: watsonNluConfig.url
})

module.exports = {
  fetchWatsonKeywords
}

async function fetchWatsonKeywords({ text }) {
  return new Promise((resolve, reject) => {
    nlu.analyze({
      text,
      features: {
        keywords: {}
      }
    }, (error, response) => {
      if (error) {
        return reject(error)
      }
      resolve(response.keywords.map(keyword => keyword.text))
    })
  })
}
