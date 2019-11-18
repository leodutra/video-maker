const fs = require('fs')

const defaultPath = name => `./state-${name}.json`

class State {
    constructor(name = 'default') {
        this.filepath = defaultPath(name)
        if (!fs.existsSync(this.filepath)) {
            this.init()
        }
    }
    init(initialState = {}) {
        this.save(initialState)
    }
    save(content) {
        fs.writeFileSync(this.filepath, JSON.stringify(content, null, 2))
    }
    load() {
        return JSON.parse(fs.readFileSync(this.filepath))
    }
    async propagate(...functions) {
        for (const fn of functions) {
            if (typeof fn !== 'function') {
                throw new TypeError(
                    `> ${this.constructor.name}.${this.propagate.name}() requires only functions.`
                )
            }
            const state = this.load()
            const result = await fn(state)
            console.log(
                `> ${this.constructor.name}: ${fn.name || 'anonymous'}() returned keys: { ${Object.keys(result).join(', ')} }`
            )
            this.save({ ...state, ...result })
        }
    }
}

module.exports = {
    State
}