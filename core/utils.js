const promisesProgress = require('promises-progress')

module.exports = {
    progressAll
}

async function progressAll(description, promises) {
    description = description || 'the items have been processed.'
    return Promise.all(
        promisesProgress(
            promises, 
            percent => console.log(`${(percent * 100).toFixed(0)} % of ${description}`)
        )
    )
}