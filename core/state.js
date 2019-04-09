const fs = require('fs')
const contentFilePath = './content.json'
const scriptFilePath = './content/after-effects-script.js'

module.exports = {
  save,
  load,
  saveScript
}

function save(content) {
  const contentString = JSON.stringify(content)
  fs.writeFileSync(contentFilePath, contentString)
}

function saveScript(content) {
  const contentString = JSON.stringify(content)
  const scriptString = `var content = ${contentString}`
  return fs.writeFileSync(scriptFilePath, scriptString)
}

function load() {
  const fileBuffer = fs.readFileSync(contentFilePath, 'utf-8')
  return JSON.parse(fileBuffer)
}
