const fs = require('fs')
const { readFileAsync, writeFileAsync } = require('./utils') 
 
class State {
  constructor(name = 'default') {
    this._fsPath = `./state-${name}.json`
    if (!fs.existsSync(this._fsPath)) {
      this.init()
    }
  }
  async init() {
    return this.save({})
  }
  async save(content) {
    await writeFileAsync(this._fsPath, JSON.stringify(content, null, 2))
    return this
  }
  async load() {
    return JSON.parse(await readFileAsync(this._fsPath, 'utf-8'))
  }
  async propagate(...functions) {
    for (const fn of functions) {    
      if (typeof fn !== 'function') {
        throw new TypeError(
          `> ${this.constructor.name}.${this.propagate.name}() requires only functions.`
        )
      }
      const state = await this.load()
      const data = await fn(state)
      const dataKeys = Object.keys(data).join(', ')
      console.log(
        `> ${this.constructor.name}: ${fn.name || 'anonymous'}() returned keys: { ${dataKeys} }`
      )
      await this.save({ ...state, ...data })
    }
    return this
  }
}

module.exports = {
  State
}