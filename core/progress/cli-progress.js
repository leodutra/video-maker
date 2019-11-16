const cliProgress = require('cli-progress')

module.exports = new cliProgress.MultiBar({
    format: 'Downloading: {bar} | ETA: {eta_formatted} | {details}',
    stopOnComplete: true,
    clearOnComplete: false,
    hideCursor: true
// }, cliProgress.Presets.shades_grey)
}, cliProgress.Presets.shades_classic)