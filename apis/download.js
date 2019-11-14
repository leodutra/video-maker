const cliProgress = require('./cli-progress')
const { once } = require('events')
const fs = require('fs')
const path = require('path')
const { DownloadWorker, utils } = require('rapid-downloader')

const progressInfo = x =>
    `${x.completedPercent}% | ${x.filename} | ${x.downloaded}/${x.total} kB | ${x.speed} | ${x.state}`

class DownloadManager {

    constructor({ showProgress = true } = {}) {
        this.showProgress = showProgress
        this.downloads = []
    }

    download(downloadUrl, saveToPath, opts) {
        const download = new Download(downloadUrl, saveToPath, opts)
        const filename = path.basename(download.saveToPath)
        if (this.showProgress) {
            let speed
            let downloaded
            let total
            let details
            download.on('progress', ({ completedPercent, totalBytes, downloadedBytes, bytesPerSecond, state }) => {
                if (totalBytes && bytesPerSecond) {
                    speed = utils.dynamicSpeedUnitDisplay(bytesPerSecond, 2)
                    downloaded = utils.byteToKb(downloadedBytes)
                    total = utils.byteToKb(totalBytes)
                    details = progressInfo({ speed, state, value, filename, total, completedPercent })
                    if (download.hasProgressBar()) {
                        download.updateProgress(downloaded, { details })
                    } else {
                        download.setProgressBar(
                            cliProgress.create(total, downloaded, { details })
                        )
                    }
                }
            })
            download.on('end', () => {
                download.updateProgress(
                    utils.byteToKb(download.getProgress().totalBytes),
                    {
                        details: progressInfo({
                            speed: 0,
                            state: 'done',
                            value: total,
                            filename,
                            total: total,
                            completedPercent: 100
                        })
                    }
                )
            })
        }
        this.downloads.push(download)
        download.start()
        return download
    }
    async downloadPromise(downloadUrl, saveToPath, opts) {
        return once(this.download(downloadUrl, saveToPath, opts), 'end')
    }
    stop(any) {
        this.downloads = this.downloads.filter(x => {
            if (x === any || x.saveToPath === any || x.downloadUrl === any) {
                x.stop()
                return false
            } else {
                return true
            }
        })
    }
}

class Download extends DownloadWorker {
    progressBar = null

    constructor(downloadUrl, saveToPath, opts) {
        super(
            downloadUrl,
            prepareFilePath(saveToPath, opts.dest),
            opts
        )
    }
    setProgressBar(progressBar) {
        this.progressBar = progressBar
    }
    hasProgressBar() {
        return !!this.progressBar
    }
    updateProgress(currentProgress, payload) {
        if (this.progressBar) {
            this.progressBar.update(currentProgress, payload)
        }
    }
    stop() {
        super.stop()
        if (this.progressBar) {
            this.progressBar.stop()
        }
    }
}

function prepareFilePath(filePath, basePath) {
    return ensureDirectoryExistence(
        uniqueFilePath(
            path.relative(
                basePath || process.cwd(),
                filePath || filenameFromURL(downloadUrl)
            )
        )
    )
}

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath)
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true })
    }
    return filePath
}

function filenameFromURL(url) {
    return url.toString().substr(url.lastIndexOf('/') + 1)
        .replace(/[\\/:*?"<>]+/gim, '-') // Windows reserved symbols
}

function uniqueFilePath(filePath) {
    const {
        name,
        ext,
        dir
    } = path.parse(filePath)
    let fileNumber = 0
    while (fs.existsSync(filePath)) {
        filePath = `${dir ? dir + path.sep : ''}${name} (${++fileNumber})${ext}`
    }
    return filePath
}

module.exports = {
    Download,
    DownloadManager
}
