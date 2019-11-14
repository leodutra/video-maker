const fs = require('fs')
const R = require('ramda')
const util = require('util')
const cliProgress = require('cli-progress')
const mkdirpLib = require('mkdirp')
const rimrafLib = require('rimraf')

const promiseAll = x => Promise.all(x)
const promisify = fn => util.promisify(fn)
const mkdirp = promisify(mkdirpLib)
const rimraf = promisify(rimrafLib)
const trimToLower = any => typeof any === 'string' ? any.trim().toLowerCase() : any
const stringify = R.curry(JSON.stringify)(R.__, R.defaultTo(null), R.defaultTo(2))
const allPromisesProgress = R.pipe(promisesProgress, promiseAll)

function promisesProgress(description, promises) {
    description = description || 'Processed items:'
    const bar = new cliProgress.Bar(
		{
			format: `${description} [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`
		}, 
		cliProgress.Presets.shades_classic
	)
    bar.start(promises.length, 0)
    let complete = 0
    return promises.map(async p => {
        await p
        bar.update(++complete)
        if (complete >= bar.getTotal()) {
            bar.stop()
        }
        return p
    })
}

module.exports = {
    allPromisesProgress,
    mkdirp,
    promiseAll,
    promisesProgress,
    promisify,
    rimraf,
    stringify,
    trimToLower,
}
