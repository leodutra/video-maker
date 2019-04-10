const algorithmia = require('algorithmia')
const got = require('got')
const jsonpath = require('jsonpath')
const promisesProgress = require('promises-progress')

const ALGORITHMIA_API_KEY = require('../credentials/algorithmia.json').apiKey

const WikipediaApi = Object.freeze({
    HTTP: 'HTTP API',
    ALGORITHMIA: 'Algorithmia'
})

module.exports = {
    searchDataByAlgorithmia,
    searchContentByAlgorithmia,
    searchPagesByApi,
    fetchDataByApi,
    fetchContentByApi,
    WikipediaApi
}

function shortenLangCode(code) {
    return code.trim().toLowerCase().split('-')[0]
}

async function searchDataByAlgorithmia({ searchTerm }) {
    console.log(`Searching Wikipedia for "${searchTerm}" using Algorithmia...`)
    const algorithmiaAuthenticated = algorithmia(ALGORITHMIA_API_KEY)
    const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
    const wikipediaResponse = await wikipediaAlgorithm.pipe(searchTerm)
    return wikipediaResponse.get()
}

async function searchContentByAlgorithmia(opts) {
    return (await searchDataByAlgorithmia(opts)).content
}

async function searchPagesByApi({ searchTerm, lang = 'en' }) {
    lang = shortenLangCode(lang)
    console.log(`Searching possible Wikipedia pages for "${searchTerm}" (${lang})...`)
    const response = await got(`https://${lang}.wikipedia.org/w/api.php`, {
        json: true,
        query: {
            action: 'opensearch',
            search: searchTerm,
            limit: 5,
            namespace: 0,
            format: 'json'
        }
    })
    const [ searchedTerm, titles, descriptions, urls ] = response.body
    return titles.map((title, i) => ({
        title,
        description: descriptions[i],
        url: urls[i]
    }))
}

async function fetchDataByApi({ exactPageTitle, lang = 'en' }) {
    lang = shortenLangCode(lang)
    console.log(`Fetching "${exactPageTitle}" Wikipedia page using Wikipedia API (${lang})...`)
    const response = await got(`https://${lang}.wikipedia.org/w/api.php`, {
        json: true,
        query: {
            action: 'query',
            prop: 'extracts|images|links|info|extlinks',
            inprop: 'url',
            redirects: 1,
            exsectionformat: 'wiki',
            explaintext: true,
            titles: exactPageTitle,
            format: 'json'
        }
    })
    const pages = Object.values(jsonpath.value(response.body, '$.query.pages'))
    if (pages.length === 0) return null
    const page = pages[0]
    console.log(`${pages.length} page(s) found. The most relevant page is "${page.title}".`)
    if (!page) return null
    console.log(`Fetching image urls for the page "${page.title}"...`)
    return {
        pageid: page.pageid,
        title: page.title,
        content: page.extract,
        summary: (page.extract || '').split('\n\n\n')[0],
        pageLanguage: page.pageLanguage,
        url: jsonpath.value(page, '$.fullurl'),
        links: jsonpath.query(page, '$.links[*].title'),
        references: jsonpath.query(page, '$.extlinks[*]["*"]'),
        images: await progressAll(
            'the image URLs have been acquired.',
            (page.images || []).map(async x => getImageFromUrl(x.title, lang))
        )
    }
}

async function fetchContentByApi(opts) {
    return (await fetchDataByApi(opts)).content
}

async function getImageFromUrl(title, lang = 'en'){
    lang = shortenLangCode(lang)
    console.log(`\t${title} (${lang})`)
    const response = await got(`https://${lang}.wikipedia.org/w/api.php`, {
        json: true,
        query: {
            action: 'query',
            prop: 'imageinfo',
            titles: title,
            format: 'json',
            iiprop: 'url'
        }
    })
    return jsonpath.value(response.body, '$.query.pages..imageinfo[0].url')
}

async function progressAll(description, promises) {
    description = description || 'the items have been processed.'
    return Promise.all(
        promisesProgress(
            promises, 
            percent => console.log(`${(percent * 100).toFixed(0)} % of ${description}`)
        )
    )
}