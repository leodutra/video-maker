const gm = require('gm').subClass({ imageMagick: true })
const { searchImages } = require('../apis/google-customsearch')
const { downloadImageToFs } = require('../apis/http')
const rimraf = require('rimraf')
const path = require('path')
const { URL } = require('url')

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
    const downloadMgr = new DownloadManager()
    console.log(`Fetching and converting images...`)
    let readyTotal = 0
    const processedSentences = await Promise.all(
        sentences.map(async (sentence, sentenceIndex) => {
            const keyword = sentence.keywords[0]
            const googleImgSearchQuery = `${searchTerm} ${keyword}`
            const images = await searchImages({ query: googleImgSearchQuery })
            const imageLinks = images.map(x => x.link)
            const downloadedImagePath = await downloadMgr.downloadUnrepeatableGoogleImage(imageLinks, sentenceIndex, keyword)
            const convertedImage = await convertImage(downloadedImagePath)
            const sentenceTextImage = await createSentenceTextImage(sentenceIndex, sentence.text)
            console.log(`${++readyTotal} images ready.`)
            return {
                ...sentence,
                googleImgSearchQuery,
                downloadedImage: convertedImage,
                textImage: sentenceTextImage
            }
        })
    )
    return {
        // downloadedImages: downloadMgr.getDownloadedImages(),
        sentences: processedSentences,
        youtubeThumbnail: await createYouTubeThumbnail(processedSentences[0].downloadedImage)
    }
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
                    throw new Error(`Imagem "${imgUrl}" já foi baixada.`)
                }
                const extension = trimToLower(new URL(imgUrl).pathname.split('.').pop())
                if (!extension || supportedImageExtensions.includes(extension) === false) {
                    throw new Error(`Imagem com extensão não suportada ou não reconhecida: "${imgUrl}".`)
                }
                this.downloadedUrlSet.add(imgUrl)
                const destination = `${CONTENT_FOLDER}/bg-${this.downloadedUrlSet.size}-${sentenceIndex}.${extension}`
                const { filename } = await downloadImageToFs(imgUrl, destination)
                console.log(`> [${sentenceIndex}][${i}] Baixou imagem com sucesso: "${imgUrl}"`)
                return filename
            } catch (error) {
                console.log(`> [${sentenceIndex}][${i}] Erro ao baixar ("${imgUrl}"): ${error}`)
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

                console.log(`> Sentence created: ${outputFile}`)
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
                console.log('> Creating YouTube thumbnail')
                resolve(outputFile)
            })
    })
}

