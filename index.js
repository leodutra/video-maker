const inputFlow  = require('./core/input-flow')
const textFlow   = require('./core/text-flow')
const imageFlow  = require('./core/image-flow')
const videoFlow  = require('./core/video-flow')
const uploadFlow = require('./core/upload-flow')

const { State }= require('./core/state')

async function start() {
  try {
    const state = new State()
    await state.init({
      credentials: {
        watsonNlu: require('./credentials/watson-nlu.json'),
        googleSearch: require('./credentials/google-search.json'),
        watsonClassifier: require('./credentials/watson-classifier.json'),
        // algorithmia: require('./credentials/algorithmia.json'),
      }
    })
    await state.propagate(
      inputFlow,
      textFlow,
      imageFlow,
      videoFlow,
      uploadFlow
    )
  }
  catch(error) {
    console.error(error)
  }
}

start();
