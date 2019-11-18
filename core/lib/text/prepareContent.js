const R = require('ramda')
const sentenceBoundaryDetection = require('sbd')
const { searchContentByAlgorithmia, fetchContentByApi, WikipediaApi } = require('../../../apis/wikipedia')
const { analyzeNaturalLanguage } = require('../../../apis/watson-natural-language-understanding')
const { promiseAll } = require('../utils')

const MAX_SENTENCES = 10

module.exports = prepareContent

async function prepareContent({ searchTerm, lang, wikipediaApi, credentials, qtySentences = MAX_SENTENCES }) {
    return R.pipeWith(R.then, [
        fetchContent(searchTerm, wikipediaApi, lang),
        checkContent(searchTerm),
        sanitizeContent,
        breakContentIntoSentences,
        limitMaximumSentences(qtySentences),
        R.map(fetchKeywordsFromWatson(credentials.watsonNlu, lang)),
        promiseAll,
        logKeywords,
        R.objOf('sentences')
    ])()
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
const fetchKeywordsFromWatson = R.curry(
    async (nluConfig, language, text) => ({
        text,
        keywords: (await analyzeNaturalLanguage({ text, language }, nluConfig))
            .result
            .keywords.map(k => k.text)
    })
)
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
