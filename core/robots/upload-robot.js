const { 
    authenticateWithOAuth, 
    uploadVideo, 
    uploadThumbnail
} = require('../../apis/youtube-upload')

module.exports = uploadRobot

async function uploadRobot({ prefix, searchTerm, videoPath }) {

    await authenticateWithOAuth()

    const videoInformation = await uploadVideo({
        videoPath,
        title: `${prefix} ${searchTerm}`,
        tags: [searchTerm, ...sentences[0].keywords],
        description: sentences.map(s => s.text).join('\n\n')
    })

    await uploadThumbnail(videoInformation)
}

