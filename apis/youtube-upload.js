const google = require('googleapis').google
const youtube = google.youtube({ version: 'v3'})
const OAuth2 = google.auth.OAuth2
const fs = require('fs')
const fastify = require('fastify')
const RxJS = require('rxjs')

module.exports = {
    authenticateWithOAuth,
    uploadThumbnail,
    uploadVideo
}

class OAuthConsentServer {
    constructor({ logger = true } = {}) {
        this.fastify = fastify({ logger })
        this.observable = RxJS.from(new Promise((resolve, reject) => {
            this.fastify.get('/oauth2callback', (req, res) => {
                const authCode = req.query.code
                console.log(`> Consent given: ${authCode}`)

                resolve(authCode)
                res.send('<h1>Thank you!</h1><p>Now close this tab.</p>')
            })
        }))
    }
    async start(port = 5000) {
        await this.fastify.listen(port)
        console.log(`> ${OAuthConsentServer.name} listening on http://localhost:${port}.`)
    }
    async waitForGoogleCallback() {
        return this.observable.toPromise()
    }
    async stop() {
        this.fastify.close()
    }
}

async function authenticateWithOAuth({ port, logger } = {}) {
    const consentServer = new OAuthConsentServer({ logger }) 
    await consentServer.start(port)
    const OAuthClient = await createOAuthClient()
    requestUserConsent(OAuthClient)
    const authorizationToken = await consentServer.waitForGoogleCallback()
    await setGlobalGoogleAuthentication(OAuthClient)
    const tokens = await requestGoogleForAccessTokens(OAuthClient, authorizationToken)
    OAuthClient.setCredentials(tokens)
    await consentServer.stop()
}

function createOAuthClient(credentials) {
    return new OAuth2(
        credentials.web.client_id,
        credentials.web.client_secret,
        credentials.web.redirect_uris[0]
    )
}
function requestUserConsent(OAuthClient) {
    const consentUrl = OAuthClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/youtube']
    })
    console.log(`> ${OAuthConsentServer.name}: Please give your consent ${consentUrl}`)
}

async function requestGoogleForAccessTokens(OAuthClient, authorizationToken) {
    const tokens = await OAuthClient.getToken(authorizationToken)
    console.log(`> Access tokens received:\n${tokens}`)
    return tokens
}

function setGlobalGoogleAuthentication(OAuthClient) {
    google.options({
        auth: OAuthClient
    })
}

async function uploadVideo({
    filePath,
    title,
    tags,
    description
  }) {
    const videoFileSize = fs.statSync(filePath).size
    const requestParameters = {
      part: 'snippet, status',
      requestBody: {
        snippet: { title, description, tags },
        status:  { privacyStatus: 'unlisted' }
      },
      media: { body: fs.createReadStream(filePath) }
    }
    const youtubeResponse = await youtube.videos.insert(requestParameters, {
      onUploadProgress: uploadProgressCurry(videoFileSize)
    })

    console.log(`> Video available at: https://youtu.be/${youtubeResponse.data.id}`)
    return youtubeResponse.data
}

async function uploadThumbnail(videoInformation, videoThumbnailFilePath) {
    console.log(`> Will upload to YouTube: ${videoThumbnailFilePath}\n\t`)
    const videoId = videoInformation.id
    const requestParameters = {
      videoId: videoId,
      media: {
        mimeType: 'image/jpeg',
        body: fs.createReadStream(videoThumbnailFilePath)
      }
    }

    const youtubeResponse = await youtube.thumbnails.set(requestParameters)
    console.log(`> Thumbnail uploaded!`)
    return youtubeResponse
}

function uploadProgressCurry(videoFileSize) {

    const bar = new cliProgress.Bar(
		{
			format: `Video upload: [{bar}] {percentage}% | ETA: {eta}s | {value}/{total} bytes`
		}, 
		cliProgress.Presets.shades_classic
    )
    
    bar.start(videoFileSize, 0)
    
    return event => {
        bar.update(++event.bytesRead)
        if (event.bytesRead >= bar.getTotal()) {
            bar.stop()
        }
    }
}

