const { searchContentByAlgorithmia, fetchContentByApi, WikipediaApi } = require('../apis/wikipedia')
const sentenceBoundaryDetection = require('sbd')
const { fetchWatsonKeywords } = require('../apis/watson-natural-language-understanding')

module.exports = {
  produceText
}

async function produceText({ searchTerm, maxSentences, lang, wikipediaApi }) {
  console.log(`Producing text content for the search term "${searchTerm}"...`)
  return Promise.resolve(searchTerm)
    .then(fetchContentCurry(wikipediaApi, lang))
    .then(content => content
      ? Promise.resolve(content)
          .then(sanitizeContent)
          .then(breakContentIntoSentences)
          .then(limitMaximumSentences(maxSentences))
          .then(fetchKeywordsOfAllSentences)
      : null
    )
}

function fetchContentCurry(wikipediaApi, lang) {
  return async searchTerm => 
    wikipediaApi === WikipediaApi.ALGORITHMIA
      ? searchContentByAlgorithmia({ searchTerm })
      : fetchContentByApi({ exactPageTitle: searchTerm, lang })
}

function sanitizeContent(content) {
  console.log(`Sanitizing content...`)
  content = removeBlankLinesAndMarkdown(content)
  return removeDatesInParentheses(content)
}

function removeBlankLinesAndMarkdown(text) {
  const allLines = text.split('\n')
  const withoutBlankLinesAndMarkdown = allLines.filter(
    line => line.trim() && line.trim().startsWith('=') === false
  )
  return withoutBlankLinesAndMarkdown.join(' ')
}

function removeDatesInParentheses(text) {
  return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/\s{2,}/g, ' ')
}

function breakContentIntoSentences(content) {
  console.log(`Breaking content into sentences...`)
  const sentences = sentenceBoundaryDetection.sentences(content)
  return sentences.map(sentence => (
    {
      text: sentence,
      keywords: [],
      images: []
    }
  ))
}

function limitMaximumSentences(max) {
  return sentences => sentences.slice(0, max)
}

async function fetchKeywordsOfAllSentences(sentences) {
  return Promise.all(
    sentences.map(
      async sentence => ({
        ...sentence,
        keywords: await fetchWatsonKeywords({ text: sentence.text })
      })
    )
  )
}
