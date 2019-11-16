const { URL } = require('url')
const { trimToLower, rimraf, mkdirp } = require('../utils')
const { allPromisesProgress } = require('../progress/promise-progress')
const { searchImages } = require('../../apis/google-customsearch')
const { downloadImageToFs } = require('../../apis/http')
const blacklistedImages = require('../../blacklist.json').images || []

const CONTENT_FOLDER = `./content`
const MAX_IMAGES_PER_SENTENCE = 10

const gMagickSupportedExtensions = [ // Reference: http://www.graphicsmagick.org/
    'jpg',
    'png',
    'jpeg',
    'gif',
    'tiff',
    'pdf'
]

module.exports = imageRobot

async function imageRobot({ searchTerm, sentences, credentials }) {
    return {
        sentences: await downloadAllImages({ searchTerm, sentences, credentials, maxPerSentence: MAX_IMAGES_PER_SENTENCE })
    }
}

async function downloadAllImages({ searchTerm, sentences, credentials, maxPerSentence }) {
    console.log(`Will produce images.\nCleaning content folder...`)
    await rimraf(`${CONTENT_FOLDER}`)
    await mkdirp(`${CONTENT_FOLDER}`)
    const downloadedImages = new Set()
    return allPromisesProgress(
        'Downloading images',
        sentences.map(async (sentence, sentenceIndex) => {
            const keyword = sentence.keywords[0]
            const uniqueWords = new Set([
                ...searchTerm.toLowerCase().split(/\s-_/),
                ...keyword.toLowerCase().split(/\s-_/)
            ])
            const query = `${searchTerm} ${[...uniqueWords].join(' ')}`
            const images = await searchImages({
                query, 
                maxCount: maxPerSentence, 
                googleSearchCredentials: credentials.googleSearch
            })
            const imgUrls = images.map(img => img.link)

            for(let i = 0; i < imgUrls.length; i++) {
                const attempt = i + 1;
                const imgUrl = imgUrls[i]
                if (downloadedImages.has(imgUrl)) {
                    logDownloadError(attempt, keyword, imgUrl, `Image already downloaded.`)
                    continue
                }
                const extension = trimToLower(new URL(imgUrl).pathname.split('.').pop())
                if (!extension || gMagickSupportedExtensions.includes(extension) === false) {
                    logDownloadError(attempt, keyword, imgUrl, `Image with unknown or unsupported extension.`)
                    continue
                }
                if (blacklistedImages.includes(imgUrl)) {
                    logDownloadError(attempt, keyword, imgUrl, 'Blacklisted image.')
                    continue
                }
                downloadedImages.add(imgUrl)
                const destination = `${CONTENT_FOLDER}/bg-${sentenceIndex}-${i}.${extension}`
                try {
                    const { filename } = await downloadImageToFs({ imgUrl, destination })
                    console.log(`\n> Downloaded image ${attempt} for "${keyword}".\n\t${imgUrl}`)
                    return {
                        ...sentence,
                        images,
                        downloadedImage: filename
                    }
                } catch (error) {
                    logDownloadError(attempt, keyword, imgUrl, error)
                }
            }
            throw new Error(`\nNo Image found for the keyword "${keyword}".`)
        })
    )
}

function logDownloadError(attempt, keyword, imgUrl, error) {
    console.log(`\n> Error downloading image ${attempt} for "${keyword}".\n\t${imgUrl}\n\t`, error)
}
