const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey

async function fetchContentFromWikipedia(searchTerm) {
    const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
    const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
    const wikipediaResponse = await wikipediaAlgorithm.pipe(searchTerm)
    const wikipediaContent = wikipediaResponse.get()
    return wikipediaContent.content
}

module.exports = {
    fetchContentFromWikipedia
}