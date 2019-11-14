const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const defaultFeatures = { keywords: {} }

module.exports = { analyzeNaturalLanguage }

let nlu

async function analyzeNaturalLanguage(analyzeParams = {}, watsonNluConfig) {
    analyzeParams.features = analyzeParams.features || defaultFeatures
    analyzeParams.language = shortenLangCode(analyzeParams.language)
    console.log(`> Natural language analysis: ${analyzeParams.text || analyzeParams.url}...`)
    if (!nlu) {
        nlu = new NaturalLanguageUnderstandingV1({
            version: watsonNluConfig.version || '2019-07-12',
            authenticator: new IamAuthenticator({
                apikey: watsonNluConfig.apikey,
            }),
            serviceUrl: watsonNluConfig.url,
        })  
    }
    return nlu.analyze(analyzeParams)
}

const shortenLangCode = code => code ? code.trim().toLowerCase().split('-')[0] : code