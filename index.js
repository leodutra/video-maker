const inputRobot = require('./core/robots/input-robot')
const textRobot = require('./core/robots/text-robot')
const imageRobot = require('./core/robots/image-robot')
const videoRobot = require('./core/robots/video-robot')
const uploadRobot = require('./core/robots/upload-robot')

const { State } = require('./core/state')

async function start() {
    const state = new State()
    // state.init({
    //     credentials: {
    //         watsonNlu: require('./credentials/watson-nlu.json'),
    //         googleSearch: require('./credentials/google-search.json'),
    //         watsonClassifier: require('./credentials/watson-classifier.json'),
    //         // algorithmia: require('./credentials/algorithmia.json'),
    //     }
    // })
    await state.propagate(
        // inputRobot,
        textRobot,
        imageRobot,
        videoRobot,
        uploadRobot
    )
}

start().catch(error => {
    console.error(error)
    process.exit(error.code || 1)
})
