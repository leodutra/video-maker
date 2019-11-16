const prompts = require('prompts')
const { stringify } = require('../utils')


const prompt = async (...questions) => 
    new Promise((resolve, reject) => 
        prompts(questions, { onCancel: onPromptCancel(reject) }).then(resolve)
    )
const onPromptCancel = reject => error => reject(new Error(`Prompt canceled: ${stringify(error)}.`))
const isValidString = (any, subject) => typeof any === 'string' && any.trim() !== '' || `Invalid ${subject || 'string'}.`
const valuesToChoices = obj => Object.values(obj).map(value => ({ title: value, value }))
const keysToChoices = obj => Object.entries(obj).map(([title, value]) => ({ title, value }))

async function askOption(subject, options, useKeys = false) {
    const { input } = await prompt({
        type: 'select',
        name: 'input',
        message: `Choose one ${subject || 'option'}:`,
        choices: useKeys
            ? keysToChoices(options)
            : valuesToChoices(options),
        validate: isValidString
    })
    return input
}

async function askText(subject) {
    if (!subject) {
        throw new TypeError(`Missing subject for ${askText.name}.`)
    }
    const { input } = await prompt({
        type: 'text',
        name: 'input',
        message: `Type the ${subject}: `,
        validate: isValidString
    })
    return input
}

module.exports = {
    prompt,
    askOption,
    askText
}
