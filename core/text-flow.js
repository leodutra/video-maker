const { searchContentByAlgorithmia, fetchContentByApi, WikipediaApi } = require('../apis/wikipedia')
const sentenceBoundaryDetection = require('sbd')
const { analyzeNaturalLanguage } = require('../apis/watson-natural-language-understanding')
const { allPromisesProgress } = require('./utils')

const MAX_SENTENCES = 10

module.exports = textFlow

async function textFlow({ searchTerm, lang, wikipediaApi, credentials, qtySentences = MAX_SENTENCES }) {
    const sentences = await (
        fetchContent(searchTerm, wikipediaApi, lang)
            .then(sanitizeContent)
            .then(breakContentIntoSentences)
            .then(limitMaximumSentences(qtySentences))
            .then(fetchNaturalSentenceUnderstanding(credentials.watsonNlu))
            .then(logKeywords)
    )
    return {
        sentences
    }
}

async function fetchContent(searchTerm, wikipediaApi, lang) {
    const content = wikipediaApi === WikipediaApi.ALGORITHMIA
        ? await searchContentByAlgorithmia({ searchTerm })
        : await fetchContentByApi({ exactPageTitle: searchTerm, lang })
    if (!content) {
        throw new Error(`Could not find page content for the search term ${searchTerm}.`)
    }
    return content
}

function sanitizeContent(content) {
    console.log(`> Sanitizing content...`)
    content = removeBlankLinesAndMarkdown(content)
    return removeDatesInParentheses(content)
}

function removeBlankLinesAndMarkdown(content) {
    console.log(`> Removing blank lines and markdown...`)
    const allLines = content.split('\n')
    const withoutBlankLinesAndMarkdown = allLines.filter(
        line => line.trim() && line.trim().startsWith('=') === false
    )
    return withoutBlankLinesAndMarkdown.join(' ')
}

function removeDatesInParentheses(content) {
    console.log(`> Removing dates in parentheses...`)
    return content.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/\s{2,}/g, ' ')
}

function breakContentIntoSentences(content) {
    console.log(`> Breaking content into sentences...`)
    return sentenceBoundaryDetection.sentences(content)
}

function limitMaximumSentences(max) {
    return sentences => {
        console.log(`> Limiting sentences to the max of ${max}...`)
        return sentences.slice(0, max)
    }
}

function fetchNaturalSentenceUnderstanding(watsonNlu) {
    return async sentences => 
        allPromisesProgress(
            `Fetching keywords from Watson:`,
            sentences.map(
                async sentence => {
                    const watsonData = await analyzeNaturalLanguage({ text: sentence }, watsonNlu)
                    return {
                        text: sentence,
                        keywords: watsonData.keywords.map(k => k.text),
                        images: []
                    }
                }
            )
        )
}

function logKeywords(sentences) {
    const topKeywords = []
    const keywords = []
    sentences.forEach(sentence =>
        sentence.keywords.forEach((k, i) => {
            if (i === 0)
                topKeywords.push(k)
            else
                keywords.push(k)
        })
    )
    console.log(`Most relevant keywords: \n\t${topKeywords.join('\n\t')}`)
    console.log(`Other keywords: ${keywords.join(', ')}`)
    return sentences
}