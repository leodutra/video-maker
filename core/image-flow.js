const gm = require('gm').subClass({ imageMagick: true })
const { searchImages } = require('../apis/google-customsearch')
const { downloadImageToFs } = require('../apis/http')
const rimraf = require('rimraf')
const path = require('path')
const { URL } = require('url')
const promisesProgress = require('promises-progress')
const blacklistedImages = require('../blacklist.json').images || []

module.exports = {
    downloadImages
}

const CONTENT_FOLDER = `./content`

const supportedImageExtensions = [ // Reference: http://www.graphicsmagick.org/
    'jpg',
    'png',
    'jpeg',
    'gif',
    'tiff',
    'pdf'
]

async function downloadImages({ searchTerm, sentences }) {
    const sentencesWithImgUrls = await fetchAllImageUrls({ searchTerm, sentences })
    const sentencesWithDownloads = await downloadAllImages(sentencesWithImgUrls)
    return sentencesWithDownloads
}

async function fetchAllImageUrls({ searchTerm, sentences }) {
    console.log(`Fetching image urls...`)
    return withProgressControl(
        'the image urls have been fetched.',
        sentences.map(async sentence => {
            const query = `${searchTerm} ${sentence.keywords[0]}`
            const images = await searchImages({ query })
            return {
                ...sentence,
                images: images.map(x => x.link)
            }
        })
    )
}

async function downloadAllImages(sentencesWithImgs) {
    console.log(`Will produce images.`)
    console.log(`Cleaning content folder...`)
    deleteByGlob(`${CONTENT_FOLDER}/*`)
    console.log(`Downloading images...`)
    const downloadedImages = new Set()
    return withProgressControl(
        'the images have been downloaded.',
        sentencesWithImgs.map(async sentence => {
            const keyword = sentence.keywords[0]
            for(let i = 0; i < sentence.images.length; i++) {
                const imgUrl = sentence.images[i]
                try {
                    if (downloadedImages.has(imgUrl)) {
                        throw new Error(`Image already downloaded.`)
                    }
                    const extension = trimToLower(new URL(imgUrl).pathname.split('.').pop())
                    if (!extension || supportedImageExtensions.includes(extension) === false) {
                        throw new Error(`Image with unknown or unsupported extension.`)
                    }
                    if (blacklistedImages.includes(imgUrl)) {
                        throw new Error('Blacklisted image.')
                    }
                    downloadedImages.add(imgUrl)
                    const destination = `${CONTENT_FOLDER}/bg-${downloadedImages.size}-${i}.${extension}`
                    const { filename } = await downloadImageToFs({ imgUrl, destination })
                    console.log(`> Downloaded image ${i + 1} for "${keyword}".\n\t${imgUrl}`)                
                    return {
                        ...sentence,
                        downloadedImage: filename
                    }
                } catch (error) {
                    console.log(`> Error downloading image ${i + 1} for "${keyword}".\n\t${imgUrl}\n\t(${error})`)
                }
            }
            throw new Error(`No Image found for the keyword "${keyword}"`)
        })
    )
}

async function deleteByGlob(dir) {
    return new Promise(resolve => rimraf(dir, error => error ? reject(error) : resolve()))
}

async function withProgressControl(description, promises) {
    return Promise.all(
        promisesProgress(
            promises,
            logPercentResolvedCurry(description)
        )
    )
}

function logPercentResolvedCurry(description = 'the items have been processed.') {
    return percent => console.log(`${(percent * 100).toFixed(0)} % of ${description}`)
}

function trimToLower(any) {
    return typeof any === 'string' ? any.trim().toLowerCase() : any
}
