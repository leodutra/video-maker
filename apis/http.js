const imageDownloader = require('image-downloader')

module.exports = {
    downloadImageToFs
}

async function downloadImageToFs({ imgUrl, destination }) {
    console.log(`> Downloading image\n\tfrom: ${imgUrl}\n\tto: ${destination}...`)
    return imageDownloader.image({
        url: imgUrl,
        dest: destination
    })
}
