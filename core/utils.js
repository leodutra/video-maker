const fs = require('fs')
const cliProgress = require('cli-progress')
const mkdirpLib = require('mkdirp')
const rimrafLib = require('rimraf')

module.exports = {
    promisesProgress,
    allPromisesProgress,
    readFileAsync,
    writeFileAsync,
    rimraf,
    mkdirp,
    trimToLower
}

async function writeFileAsync(file, data, options) {
	return new Promise((resolve, reject) => 
        fs.writeFile(file, data, options, error => 
            error ? reject(error) : resolve()
        )
	)
}

async function readFileAsync(file, options) {
	return new Promise((resolve, reject) => 
        fs.readFile(file, options, (error, data) => 
            error ? reject(error) : resolve(data)
        )
	)
}

async function allPromisesProgress(description, promises) {
    return Promise.all(promisesProgress(description, promises))
}

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

async function rimraf(dir) {
    return new Promise((resolve, reject) => rimrafLib(dir, error => error ? reject(error) : resolve()))
}

async function mkdirp(dir) {
    return new Promise((resolve, reject) => mkdirpLib(dir, error => error ? reject(error) : resolve()))
}

function trimToLower(any) {
    return typeof any === 'string' ? any.trim().toLowerCase() : any
}
