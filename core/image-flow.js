const gm = require('gm').subClass({ imageMagick: true })
const { searchImages } = require('../apis/google-customsearch')
const { downloadImageToFs } = require('../apis/http')
const rimraf = require('rimraf')
const path = require('path')
const { URL } = require('url')
const promisesProgress = require('promises-progress')

module.exports = {
    produceImages
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

async function produceImages({ searchTerm, sentences }) {
    console.log(`Will produce images.`)
    console.log(`Cleaning content folder...`)
    deleteByGlob(`${CONTENT_FOLDER}/*`)
    console.log(`Fetching and converting images...`)
    const downloadMgr = new DownloadManager()
    const processedSentences = await Promise.all(
        promisesProgress(
            sentences.map(processSentenceCurry(searchTerm, downloadMgr)),
            logPercentResolvedCurry('sentences')
        )
    )
    return {
        downloadedImages: downloadMgr.getDownloadedImages(),
        sentences: processedSentences,
        youtubeThumbnail: await createYouTubeThumbnail(processedSentences[0].downloadedImage)
    }
}

function processSentenceCurry(searchTerm, downloadMgr) {
    return async (sentence, sentenceIndex) => {
        const keyword = sentence.keywords[0]
        const googleImgSearchQuery = `${searchTerm} ${keyword}`
        const images = await searchImages({ query: googleImgSearchQuery })
        const imageLinks = images.map(x => x.link)
        const downloadedImagePath = await downloadMgr.downloadUnrepeatableGoogleImage(imageLinks, sentenceIndex, keyword)
        const convertedImage = await convertImage(downloadedImagePath)
        const sentenceTextImage = await createSentenceTextImage(sentenceIndex, sentence.text)
        return {
            ...sentence,
            googleImgSearchQuery,
            downloadedImage: convertedImage,
            textImage: sentenceTextImage
        }
    }
}

function logPercentResolvedCurry(subject, verb = 'processed') {
    return percent => console.log(`${(percent * 100).toFixed(0)} % of the ${subject} have been ${verb}.`)
}

async function deleteByGlob(dir) {
    return new Promise(resolve => rimraf(dir, error => error ? reject(error) : resolve()))
}

class DownloadManager {
    constructor() {
        this.downloadedUrlSet = new Set()
    }

    async downloadUnrepeatableGoogleImage(imageUrls, sentenceIndex, keyword) {
        for(let i = 0; i < imageUrls.length; i++) {
            const imgUrl = imageUrls[i]
            try {
                if (this.downloadedUrlSet.has(imgUrl)) {
                    throw new Error(`Image already downloaded.`)
                }
                const extension = trimToLower(new URL(imgUrl).pathname.split('.').pop())
                if (!extension || supportedImageExtensions.includes(extension) === false) {
                    throw new Error(`Imagem with unknown or unsupported extension.`)
                }
                this.downloadedUrlSet.add(imgUrl)
                const destination = `${CONTENT_FOLDER}/bg-${this.downloadedUrlSet.size}-${sentenceIndex}.${extension}`
                const { filename } = await downloadImageToFs({ imgUrl, destination })
                console.log(`> Downloaded image ${i + 1} for "${keyword}".\n\t${imgUrl}`)                
                return filename
            } catch (error) {
                console.log(`> Error downloading image ${i + 1} for "${keyword}".\n\t${imgUrl}\n\t(${error})`)
            }
        }
        throw new Error(`No Image found for the keyword "${keyword}"`)
    }

    getDownloadedImages() {
        return new Set(this.downloadedUrlSet)
    }
}

function trimToLower(any) {
    return typeof any === 'string' ? any.trim().toLowerCase() : any
}

async function convertImage(imgPath) {
    return new Promise((resolve, reject) => {
        const extension = path.extname(imgPath)
        const basename = path.basename(imgPath, extension)
        
        const inputFile = imgPath
        const outputFile = path.resolve(CONTENT_FOLDER, `converted-${basename}${extension}`)
        const width = 1920
        const height = 1080

        gm()
            .in(inputFile)
            .out('(')
            .out('-clone')
            .out('0')
            .out('-background', 'white')
            .out('-blur', '0x9')
            .out('-resize', `${width}x${height}^`)
            .out(')')
            .out('(')
            .out('-clone')
            .out('0')
            .out('-background', 'white')
            .out('-resize', `${width}x${height}`)
            .out(')')
            .out('-delete', '0')
            .out('-gravity', 'center')
            .out('-compose', 'over')
            .out('-composite')
            .out('-extent', `${width}x${height}`)
            .write(outputFile, (error) => {
                if (error) {
                    return reject(error)
                }
                console.log(`> Image converted: ${inputFile}`)
                resolve(outputFile)
            })
    })
}

async function createSentenceTextImage(sentenceIndex, sentenceText) {
    return new Promise((resolve, reject) => {
        const outputFile = `${CONTENT_FOLDER}/sentence-${sentenceIndex}.png`
        const templateSettings = {
            0: {
                size: '1920x400',
                gravity: 'center'
            },
            1: {
                size: '1920x1080',
                gravity: 'center'
            },
            2: {
                size: '800x1080',
                gravity: 'west'
            },
            3: {
                size: '1920x400',
                gravity: 'center'
            },
            4: {
                size: '1920x1080',
                gravity: 'center'
            },
            5: {
                size: '800x1080',
                gravity: 'west'
            },
            6: {
                size: '1920x400',
                gravity: 'center'
            }
        }
        gm()
            .out('-size', templateSettings[sentenceIndex].size)
            .out('-gravity', templateSettings[sentenceIndex].gravity)
            .out('-background', 'transparent')
            .out('-fill', 'white')
            .out('-kerning', '-1')
            .out(`caption:${sentenceText}`)
            .write(outputFile, (error) => {
                if (error) {
                    return reject(error)
                }
                console.log(`> Sentence file created: ${outputFile}`)
                resolve()
            })
    })
}

async function createYouTubeThumbnail(inputPath) {
    return new Promise((resolve, reject) => {
        const outputFile = `${CONTENT_FOLDER}/thumbnail-youtube.jpg`

        gm()
            .in(inputPath)
            .write(outputFile, (error) => {
                if (error) {
                    return reject(error)
                }
                console.log('> Creating YouTube thumbnail.')
                resolve(outputFile)
            })
    })
}
