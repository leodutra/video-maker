const fs = require('fs')
const R = require('ramda')
const util = require('util')
const cliProgress = require('cli-progress')
const mkdirpLib = require('mkdirp')
const rimrafLib = require('rimraf')

const promiseAll = array => Promise.all(array)
const promisify = fn => util.promisify(fn)
const mkdirp = promisify(mkdirpLib)
const rimraf = promisify(rimrafLib)
const trimToLower = any => typeof any === 'string' ? any.trim().toLowerCase() : any
const stringify = R.curry(JSON.stringify)(R.__, R.defaultTo(null), R.defaultTo(2))

module.exports = {
    mkdirp,
    promiseAll,
    promisify,
    rimraf,
    stringify,
    trimToLower,
}
