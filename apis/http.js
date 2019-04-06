const imageDownloader = require('image-downloader')

module.exports = {
    downloadImageToFs
}

async function downloadImageToFs({ imgUrl, destination }) {
    return imageDownloader.image({
        url: imgUrl,
        dest: destination
    })
}
