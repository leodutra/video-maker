const google = require('googleapis').google
const customSearch = google.customsearch('v1')

module.exports = {
    searchImages
}

async function searchImages({ query, maxCount = 20, googleSearchCredentials }) {
    console.log(`> Searching Google images for "${query}" (max: ${maxCount})...`)
    const response = await customSearch.cse.list({
        auth: googleSearchCredentials.apiKey,
        cx: googleSearchCredentials.searchEngineId,
        q: query,
        searchType: 'image',
        num: maxCount
    })
    return response.data.items
}

