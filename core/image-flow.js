const rimraf = require('rimraf')
const { URL } = require('url')
const { allPromisesProgress } = require('./utils')
const { searchImages } = require('../apis/google-customsearch')
const { downloadImageToFs } = require('../apis/http')
const blacklistedImages = require('../blacklist.json').images || []

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

module.exports = imageFlow

async function imageFlow({ searchTerm, sentences }) {
    return {
        sentences: await downloadAllImages({ searchTerm, sentences, maxCount: MAX_IMAGES_PER_SENTENCE })
    }
}

async function downloadAllImages({ searchTerm, sentences, maxCount }) {
    console.log(`Will produce images.\nCleaning content folder...`)
    deleteByGlob(`${CONTENT_FOLDER}/*`)
    const downloadedImages = new Set()
    return allPromisesProgress(
        'Downloading images:',
        sentences.map(async sentence => {
            const keyword = sentence.keywords[0]
            const uniqueWords = new Set([
                ...searchTerm.split(/\s-_/),
                ...keyword.split(/\s-_/)
            ])
            const query = [...uniqueWords].join(' ')
            const images = await searchImages({ query, maxCount })
            const imgUrls = images.map(img => img.link)

            for(let i = 0; i < imgUrls.length; i++) {
                const attempt = i + 1;
                const imgUrl = imgUrls[i]
                let error = null
                if (downloadedImages.has(imgUrl)) {
                    error = `Image already downloaded.`
                    continue
                }
                const extension = trimToLower(new URL(imgUrl).pathname.split('.').pop())
                if (!extension || gMagickSupportedExtensions.includes(extension) === false) {
                    error = `Image with unknown or unsupported extension.`
                    continue
                }
                if (blacklistedImages.includes(imgUrl)) {
                    error = 'Blacklisted image.'
                    continue
                }
                downloadedImages.add(imgUrl)
                const destination = `${CONTENT_FOLDER}/bg-${downloadedImages.size}-${i}.${extension}`
                try {
                    const { filename } = await downloadImageToFs({ imgUrl, destination })
                    console.log(`\n> Downloaded image ${i + 1} for "${keyword}".\n\t${imgUrl}.`)                
                    return {
                        ...sentence,
                        images,
                        downloadedImage: filename
                    }
                } catch (error) {
                    error = error.message
                }
                if (error) {
                    console.log(`\n> Error downloading image ${attempt} for "${keyword}".\n\t${imgUrl}\n\t(${error}).`)
                }
            }
            throw new Error(`\nNo Image found for the keyword "${keyword}".`)
        })
    )
}

async function deleteByGlob(dir) {
    return new Promise(resolve => rimraf(dir, error => error ? reject(error) : resolve()))
}

function trimToLower(any) {
    return typeof any === 'string' ? any.trim().toLowerCase() : any
}
