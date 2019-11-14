const cliProgress = require('cli-progress')
const { once } = require('events')
const fs = require('fs')
const path = require('path')
const { DownloadWorker, utils } = require('rapid-downloader')

class DownloadManager {

    static progressBars = new cliProgress.MultiBar({
        format: 'Downloading: {bar} {percentage}% | {filename} | ETA: {eta_formatted} | {value}/{total} kB | {speed} | {state}',
        stopOnComplete: true,
        clearOnComplete: false,
        hideCursor: true
    }, cliProgress.Presets.shades_grey)

    downloads = []

    constructor({ showProgress = true } = {}) {
        this.showProgress = showProgress
    }

    download(downloadUrl, saveToPath, opts) {
        const download = new Download(downloadUrl, saveToPath, opts)
        if (this.showProgress) {
            download.on('progress', ({ totalBytes, downloadedBytes, bytesPerSecond, state }) => {
                if (totalBytes && bytesPerSecond) {
                    const speed = utils.dynamicSpeedUnitDisplay(bytesPerSecond, 2)
                    if (download.hasProgressBar()) {
                        download.updateProgress(
                            utils.byteToKb(downloadedBytes),
                            { speed, state }
                        )
                    } else {
                        download.setProgressBar(
                            DownloadManager.progressBars.create(
                                utils.byteToKb(totalBytes),
                                utils.byteToKb(downloadedBytes),
                                {
                                    filename: path.basename(download.saveToPath),
                                    speed,
                                    state
                                }
                            )
                        )
                    }
                }
            })
            download.on('end', () => {
                download.updateProgress(
                    utils.byteToKb(download.getProgress().totalBytes),
                    { speed: '0 b/s', state: 'done' }
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
