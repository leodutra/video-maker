const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')

const defaultFeatures = {
    keywords: {}
}

module.exports = {
    analyzeNaturalLanguage
}

let nlu

async function analyzeNaturalLanguage(analyzeParams = {}, watsonNluConfig) {
    analyzeParams.features = analyzeParams.features || defaultFeatures
    console.log(`> Natural language analysis: ${analyzeParams.text || analyzeParams.url}...`)
    if (!nlu) {
        nlu = new NaturalLanguageUnderstandingV1({
            iam_apikey: watsonNluConfig.apikey,
            version: watsonNluConfig.version || '2019-07-12',
            url: watsonNluConfig.url
        })
    }
    return new Promise((resolve, reject) => {
        nlu.analyze(analyzeParams, (error, response) => error ? reject(error) : resolve(response))
    })
}
