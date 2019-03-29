const contentFilePath = './content.json'
const fs = require('fs')

module.exports = {
  save,
  load
}

function save(content) {
  const contentString = JSON.stringify(content)
  fs.writeFileSync(contentFilePath, contentString)
}

function load() {
  const fileBuffer = fs.readFileSync(contentFilePath, 'utf-8')
  return JSON.parse(fileBuffer)
}
