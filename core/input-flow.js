const prompts = require('prompts')
const { getGoogleTrendsFromRss, getGoogleTrendsFromApi } = require('../apis/google-trends')
const { searchPagesByApi, fetchDataByApi } = require('../apis/wikipedia')
const { getImbdTrends } = require('../apis/imdb')
const { classifyImage } = require('../apis/watson-visual-recognition')
const { WikipediaApi } = require('../apis/wikipedia')

const MAX_SUGGESTION_COUNT = 15

const prefixes = Object.freeze([
    'Who is',
    'What is',
    'The history of'
])

const languages = Object.freeze({
    'Português (BR)': 'pt-BR',
    'English (US)': 'en-US',
    'Español (ES)': 'es-ES'
})

const ServiceType = Object.freeze({
    GOOGLE_TRENDS_API: 'Google Trends(API)',
    GOOGLE_TRENDS_RSS: 'Google Trends(RSS)',
    IMDB_TRENDS: 'IMDB trends',
    WATSON_IMG_CLASSF: 'Watson - Image Classification',
    WIKIPEDIA_SEARCH: 'Wikipedia search'
})

module.exports = inputFlow

async function inputFlow({ credentials }) {
    let searchTerm
    let lang
    let qtySentences
    let wikipediaApi
    while (!searchTerm) {
        lang = await askOption('language', languages, true)
        const serviceType = await askOption('search type', ServiceType)
        const suggestions = await suggestSearchTerms(serviceType, lang, MAX_SUGGESTION_COUNT)
        if (suggestions.length) {
            searchTerm = await askOption('search term', suggestions)
        }
        else {
            switch (serviceType) {
                case ServiceType.WATSON_IMG_CLASSF:
                    const imagePath = await askText(`image path for ${ServiceType.WATSON_IMG_CLASSF}`)
                    searchTerm = await classifyImage({ imagePath, watsonClassifierCredentials: credentials.watsonClassifier })
                    break
                default:
                case ServiceType.WIKIPEDIA_SEARCH:
                    searchTerm = await askText(`${serviceType} search term`)
                    break
            }
        }
        qtySentences = Number(await askText('number of sentences you want in your video: '))
        wikipediaApi = await askOption('Wikipedia API', WikipediaApi)

        // PREVENTS DISAMBIGUATION AND TYPOS
        if (wikipediaApi === WikipediaApi.HTTP) {
            const possiblePages = await searchPagesByApi({ searchTerm, lang })
            if (possiblePages.length) {
                searchTerm = await askOption('Wikipedia page', possiblePages.map(x => x.title))
            }
            else {
                console.log(`Nenhuma página encontrada para esta busca ("${searchTerm}").`)
                searchTerm = null
            }
        }
    }
    return {
        prefix: await askOption('prefix', prefixes),
        searchTerm,
        lang,
        wikipediaApi,
        qtySentences,
    }
}

async function suggestSearchTerms(suggestionType, lang, maxCount) {
    console.log(`Preparing suggestions from ${suggestionType}...`)
    switch (suggestionType.trim()) {
        case ServiceType.GOOGLE_TRENDS_API:
            return await getGoogleTrendsFromApi({ lang, maxCount })
        case ServiceType.GOOGLE_TRENDS_RSS:
            return await getGoogleTrendsFromRss({ lang, maxCount })
        case ServiceType.IMDB_TRENDS:
            return await getImbdTrends({ maxCount })
        default:
            return []
    }
}

async function askOption(subject, options, useKeys = false) {
    const { input } = await prompt({
        type: 'select',
        name: 'input',
        message: `Choose one ${subject || 'option'}:`,
        choices: useKeys
            ? keysToChoices(options)
            : valuesToChoices(options),
        validate: isValidString
    })
    return input
}

async function askText(subject) {
    if (!subject) {
        throw new TypeError(`Missing subject for ${askText.name}.`)
    }
    const { input } = await prompt({
        type: 'text',
        name: 'input',
        message: `Type the ${subject}: `,
        validate: isValidString
    })
    return input
}

async function prompt(...questions) {
    return new Promise((resolve, reject) => {
        const promptOptions = {
            onCancel: (error) => reject(new Error(`Prompt canceled: ${JSON.stringify(error, null, 2)}.`))
        }
        prompts(questions, promptOptions)
            .then(resolve)
    })
}

function isValidString(any, subject) {
    return typeof any === 'string' ? any.trim() !== '' : `Invalid ${subject || 'string'}.`
}

function valuesToChoices(obj) {
    return Object.values(obj).map(v => ({ title: v, value: v }))
}

function keysToChoices(obj) {
    return Object.keys(obj).map(k => ({ title: k, value: obj[k] }))
}

