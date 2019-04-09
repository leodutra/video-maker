const state = require('./core/state')
const { askQuestions } = require('./core/input-flow')
const { produceText }  = require('./core/text-flow')
const { downloadImages }  = require('./core/image-flow')
const { produceVideo }  = require('./core/video-flow')
const { uploadContent }  = require('./core/upload-flow')

async function start() {
  const {
    searchTerm,
    prefix,
    lang,
    wikipediaApi
  } = await askQuestions()
  const sentences = await produceText({ searchTerm, maxSentences: 7, lang, wikipediaApi })
  const hypertext = await downloadImages({ searchTerm, sentences })
  const { renderedVideo } = await produceVideo({ sentences: hypertext })
  // await uploadContent({ prefix, searchTerm, videoPath: renderedVideo })
}

start();
