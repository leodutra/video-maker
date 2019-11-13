const fs = require('fs')
const { readFile, writeFile } = require('./utils')

const defaultPath = name => `./state-${name}.json`

class State {
    constructor(name = 'default') {
        this.filepath = defaultPath(name)
        if (fs.existsSync(this.filepath)) {
            this.load()
        } else {
            this.init()
        }
    }
    async init(initialState = {}) {
        this.save(initialState)
    }
    async save(content) {
        await writeFile(this.filepath, JSON.stringify(content, null, 2))
    }
    async load() {
        return JSON.parse(await readFile(this.filepath, 'utf-8'))
    }
    async propagate(...functions) {
        for (const fn of functions) {
            if (typeof fn !== 'function') {
                throw new TypeError(
                    `> ${this.constructor.name}.${this.propagate.name}() requires only functions.`
                )
            }
            const result = await fn(await this.load())
            console.log(
                `> ${this.constructor.name}: ${fn.name || 'anonymous'}() returned keys: { ${Object.keys(result).join(', ')} }`
            )
            await this.save(result)
        }
        return this
    }
}

module.exports = {
    State
}