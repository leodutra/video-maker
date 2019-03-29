const superAgent =  require('superagent');
const jsonpath = require('jsonpath')

const ALGORITHMIA_API_KEY = require('../credentials/algorithmia.json').apiKey

module.exports = {
    searchDataByAlgorithmia,
    searchContentByAlgorithmia,
    searchPagesByApi,
    fetchDataByApi,
    fetchContentByApi
}

async function searchDataByAlgorithmia(searchTerm) {
    const algorithmiaAuthenticated = algorithmia(ALGORITHMIA_API_KEY)
    const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
    const wikipediaResponse = await wikipediaAlgorithm.pipe(searchTerm)
    return wikipediaResponse.get()
}

async function searchContentByAlgorithmia(searchTerm) {
    return (await searchDataByAlgorithmia(searchTerm)).content
}

async function searchPagesByApi(searchTerm) {
    const response = await superAgent.get('https://en.wikipedia.org/w/api.php').query({
        action: 'opensearch',
        search: searchTerm,
        limit: 5,
        namespace: 0,
        format: 'json'
    })
    const [ searchedTerm, titles, descriptions, urls ] = response.body
    return titles.map((title, i) => ({
        title,
        description: descriptions[i],
        url: urls[i]
    }))
}

async function fetchDataByApi(exactPageTitle) {
    const response = await superAgent.get('https://en.wikipedia.org/w/api.php').query({
        action: 'query',
        prop: 'extracts|images|links|info|extlinks',
        inprop: 'url',
        redirects: 1,
        exsectionformat: 'wiki',
        explaintext: true,
        titles: exactPageTitle,
        format: "json"
    })
    const pages = jsonpath.value(response.body, '$.query.pages')
    const page = pages[Object.keys(pages)[0]]
    if (!page) {
        return null
    }
    return {
        pageid: page.pageid,
        title: page.title,
        content: page.extract,
        summary: page.extract.split('\n\n\n')[0],
        pageLanguage: page.pageLanguage,
        url: jsonpath.value(page, '$.fullurl'),
        links: jsonpath.query(page, '$.links[*].title'),
        references: jsonpath.query(page, '$.extlinks[*]["*"]'),
        images: await Promise.all(
            page.images.map(async x => getURLImage(x.title))
        )
    }
}

async function fetchContentByApi(exactPageTitle) {
    return (await fetchDataByApi(exactPageTitle)).content
}

async function getURLImage(title){
    const response = await superAgent.get('https://en.wikipedia.org/w/api.php').query({
        action: 'query',
        prop: 'imageinfo',
        titles: title,
        format: 'json',
        iiprop: 'url'
    })
    return jsonpath.value(response.body, '$.query.pages..imageinfo[0].url')
}

