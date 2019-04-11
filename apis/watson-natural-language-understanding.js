
const watsonNluConfig = require('../credentials/watson-nlu.json')
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')

const nlu = new NaturalLanguageUnderstandingV1({
  iam_apikey: watsonNluConfig.apikey,
  version: '2018-11-16',
  url: watsonNluConfig.url
})

const defaultFeatures = {
  keywords: {}
}

module.exports = {
  analyzeNaturalLanguage
}

async function analyzeNaturalLanguage(opts = {}) {
  opts.features = opts.features || defaultFeatures
  console.log(`> Natural language analysis: ${opts.text || opts.url}...`)
  return new Promise((resolve, reject) => {
    nlu.analyze(opts, (error, response) => error ? reject(error) : resolve(response))
  })
}
