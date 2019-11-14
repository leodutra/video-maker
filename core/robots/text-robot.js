const { searchContentByAlgorithmia, fetchContentByApi, WikipediaApi } = require('../../apis/wikipedia')
const sentenceBoundaryDetection = require('sbd')
const { analyzeNaturalLanguage } = require('../../apis/watson-natural-language-understanding')
const { allPromisesProgress } = require('../utils')
const R = require('ramda')

const MAX_SENTENCES = 10

module.exports = textRobot

async function textRobot({ searchTerm, lang, wikipediaApi, credentials, qtySentences = MAX_SENTENCES }) {
    return R.pipe(
        fetchContent(searchTerm, wikipediaApi, lang),
        checkContent(searchTerm),
        sanitizeContent,
        breakContentIntoSentences,
        limitMaximumSentences(qtySentences),
        R.map(fetchKeywordsFromWatson(credentials.watsonNlu)),
        x => Promise.all(x),
        logKeywords,
        R.objOf('sentences')
    )()
}

const limitMaximumSentences = R.take
const breakContentIntoSentences = content => sentenceBoundaryDetection.sentences(content)
const removeDatesInParentheses = content =>
    content
        .replace(/\((?:\([^()]*\)|[^()])*\)/gm, '')
        .replace(/\s{2,}/g, ' ')

const removeBlankLinesAndMarkdown = R.pipe(
    R.split('\n'),
    R.filter(R.compose(
        R.not,
        R.startsWith('='),
        R.trim
    )),
    R.join(' ')
)
const sanitizeContent = R.pipe(removeBlankLinesAndMarkdown, removeDatesInParentheses)
const fetchKeywordsFromWatson = watsonNlu => async text => ({
        text,
        keywords: (await analyzeNaturalLanguage({ text }, watsonNlu))
            .keywords.map(k => k.text)
})
const fetchContent = (searchTerm, wikipediaApi, lang) => async () =>
    wikipediaApi === WikipediaApi.ALGORITHMIA
        ? searchContentByAlgorithmia({ searchTerm })
        : fetchContentByApi({ exactPageTitle: searchTerm, lang })

const throwError = error => { throw new Error(error) }
const checkContent = searchTerm => content =>
    content ? content : throwError(`Could not find page content for the search term ${searchTerm}.`)

function logKeywords(sentences) {
    const topKeywords = R.pipe(
        R.map(R.compose(R.head, R.prop('keywords'))),
        R.flatten,
        R.join('\n\t')
    )
    const otherKeywords = R.pipe(
        R.map(R.compose(R.tail, R.prop('keywords'))),
        R.flatten,
        R.join(', ')
    )
    console.log(`Most relevant keywords: \n\t${topKeywords(sentences)}`)
    console.log(`Other keywords: ${otherKeywords(sentences)}`)
    return sentences
}

