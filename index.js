const state = require('./core/state')
const { askQuestions } = require('./core/input')
const { produceText }  = require('./core/text')

async function start() {
  const content = await Promise.resolve(askQuestions())
    .then(produceText)

  console.log(JSON.stringify(content, null, 4))
}

start();
