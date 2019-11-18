const R = require('ramda')
const { promiseAll } = require('../utils')
const cliProgress = require('./cli-progress')

const progressInfo = x =>
    `${x.completedPercent}% | ${x.description} | ${x.completed}/${x.total}`

const percentage = (completed, total) => (completed * 100 / total).toFixed(2)

function promisesProgress(description, promises) {
    description = description || 'Processed items:'
    const total = promises.length
    let completed = 0
    const bar = cliProgress.create(total, completed, {
        details: progressInfo({
            completedPercent: percentage(completed, total),
            description,
            completed,
            total
        })
    })
    bar.start(total, completed)
    return promises.map(async p => {
        await p
        bar.update(++completed, {
            details: progressInfo({
                completedPercent: percentage(completed, total),
                description,
                completed,
                total
            })
        })
        if (completed >= total) {
            bar.stop()
            cliProgress.update()
        }
        return p
    })
}
const allPromisesProgress = R.pipe(promisesProgress, promiseAll)

module.exports = {
    allPromisesProgress,
    promisesProgress
}