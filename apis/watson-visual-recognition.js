const fs = require('fs')
const requestPromise = require('request-promise')

module.exports = {
    classifyImage
}

async function classifyImage({ imagePath, watsonClassifierCredentials }) {
    console.log(`> Watson will classify image "${imagePath}"...`)
    const identifiedClasses = await requestWatson(imagePath, watsonClassifierCredentials)
    return identifiedClasses.images[0].classifiers[0].classes[0].class
}

async function requestWatson(imagePath, watsonClassifierCredentials) {
    const headers = {
        'Authorization': 'Basic ' + Buffer.from('apiKey:' + watsonClassifierCredentials.apiKey).toString('base64')
    }

    const url = watsonClassifierCredentials.url || 'https://gateway.watsonplatform.net/visual-recognition/api'
    const version = watsonClassifierCredentials.version || '2018-03-19'
    const response = requestPromise.post({
        headers: headers,
        url: `${url}/v3/classify?version=${version}`,
        transform: JSON.parse
    })

    response.form().append('images_file', fs.createReadStream(imagePath))
    return response
}

