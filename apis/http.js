const imageDownloader = require('image-downloader')

module.exports = {
    downloadImageToFs
}

async function downloadImageToFs(imageUrl, destination) {
    return imageDownloader.image({
        url: imageUrl,
        dest: destination
    })
}
