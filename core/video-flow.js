const gm = require('gm').subClass({imageMagick: true})
const spawn = require('child_process').spawn
const path = require('path')
const fs = require('fs')

const CONTENT_FOLDER = `./content`
const rootPath = path.resolve(__dirname, '..')

module.exports = videoFlow

async function videoFlow({ sentences }) {
  const convertedImages = await convertAllImages(sentences)
  const sentenceImages = await createAllSentenceImages(sentences)
  const youtubeThumbnail = await createYouTubeThumbnail(sentenceImages[0])
  console.log('DONE')
  // const scriptPath = await createAfterEffectsScript({ sentences })
  // const videoPath = await renderVideoWithAfterEffects()
  return {
    convertedImages,
    sentenceImages,
    youtubeThumbnail,
    // videoPath,
    // scriptPath
  }
}

async function convertAllImages(sentences) {
  console.log('Converting background images...')
  return Promise.all(
    sentences.map(sentence => convertImage(sentence.downloadedImage))
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

        console.log(`> Image converted: ${inputFile}.`)
        resolve(outputFile)
      })
  })
}

async function createAllSentenceImages(sentences) {
  console.log('Creating sentence images...')
  return Promise.all(
    sentences.map((sentence, index) => createSentenceImage(index, sentence.text))
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
      },
      7: {
        size: '1920x400',
        gravity: 'center'
      },
      8: {
        size: '1920x1080',
        gravity: 'center'
      },
      9: {
        size: '800x1080',
        gravity: 'west'
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

        console.log(`> Sentence created: ${outputFile}.`)
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

        console.log('> Creating YouTube thumbnail.')
        resolve(outputPath)
      })
  })
}

async function createAfterEffectsScript(content) {
  const outputFile = `${CONTENT_FOLDER}/after-effects-script.js`
  const scriptString = `var content = ${JSON.stringify(content)}`
  fs.writeFileSync(outputFile, scriptString)
  return outputFile
}

async function renderVideoWithAfterEffects() {
  return new Promise((resolve, reject) => {
    const aerenderFilePath = '/Applications/Adobe After Effects CC 2019/aerender'
    const templateFilePath = `${rootPath}/templates/1/template.aep`
    const destinationFilePath = `${rootPath}/content/output.mov`

    console.log('> Starting After Effects.')

    const aerender = spawn(aerenderFilePath, [
      '-comp', 'main',
      '-project', templateFilePath,
      '-output', destinationFilePath
    ])

    aerender.stdout.on('data', (data) => {
      process.stdout.write(data)
    })

    aerender.on('close', () => {
      console.log('> After Effects closed.')
      resolve(destinationFilePath)
    })
  })
}
