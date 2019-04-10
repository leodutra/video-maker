const gm = require('gm').subClass({imageMagick: true})
const spawn = require('child_process').spawn
const path = require('path')
const { progressAll } = require('./utils')
const rootPath = path.resolve(__dirname, '..')

const CONTENT_FOLDER = `./content`
const PATH_AFTER_EFFECTS_SCRIPT = `${CONTENT_FOLDER}/after-effects-script.js`

module.exports = {
  produceVideo
}

async function produceVideo({ sentences }) {
  const convertedImages = await convertAllImages(sentences)
  const sentenceImages = await createAllSentenceImages(sentences)
  const youtubeThumbnail = await createYouTubeThumbnail(sentenceImages[0])
  console.log('DONE')
  // await createAfterEffectsScript({ sentences })
  // const renderedVideo = await renderVideoWithAfterEffects()
  return {
    convertedImages,
    sentenceImages,
    youtubeThumbnail,
    renderedVideo,
    scriptPath: PATH_AFTER_EFFECTS_SCRIPT 
  }
}

async function convertAllImages(sentences) {
  return progressAll(
    'the sentence images have been converted.',
    sentences.map((sentence, i) => convertImage(sentence.downloadedImage))
  )
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

async function createAllSentenceImages(sentences) {
  return progressAll(
    'the sentence images have been created.',
    sentences.map((sentence, i) => createSentenceImage(i, sentence.text))
  )
}

async function createSentenceImage(sentenceIndex, sentenceText) {
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
        resolve(outputFile)
      })
  })
}

async function createYouTubeThumbnail(imgPath) {
  return new Promise((resolve, reject) => {
    const outputPath = `${CONTENT_FOLDER}/youtube-thumbnail.jpg`
    gm()
      .in(imgPath)
      .write(outputPath, (error) => {
        if (error) {
          return reject(error)
        }

        console.log('> Creating YouTube thumbnail')
        resolve(outputPath)
      })
  })
}

async function createAfterEffectsScript(content) {
  const contentString = JSON.stringify(content)
  const scriptString = `var content = ${contentString}`
  return fs.writeFileSync(PATH_AFTER_EFFECTS_SCRIPT, scriptString)
}

async function renderVideoWithAfterEffects() {
  return new Promise((resolve, reject) => {
    const aerenderFilePath = '/Applications/Adobe After Effects CC 2019/aerender'
    const templateFilePath = `${rootPath}/templates/1/template.aep`
    const destinationFilePath = `${rootPath}/content/output.mov`

    console.log('> Starting After Effects')

    const aerender = spawn(aerenderFilePath, [
      '-comp', 'main',
      '-project', templateFilePath,
      '-output', destinationFilePath
    ])

    aerender.stdout.on('data', (data) => {
      process.stdout.write(data)
    })

    aerender.on('close', () => {
      console.log('> After Effects closed')
      resolve(destinationFilePath)
    })
  })
}
