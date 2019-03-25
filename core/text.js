const { searchContentByAlgorithmia, fetchContentByApi } = require('../apis/wikipedia')
const sentenceBoundaryDetection = require('sbd')
const { fetchWatsonKeywords } = require('../apis/watson-natural-language-understanding')

async function produceText({ searchTerm, maxSentences }) {
  return Promise.resolve(searchTerm)
    //.then(searchContentByAlgorithmia)
    .then(fetchContentByApi)
    .then(sanitizeContent)
    .then(breakContentIntoSentences)
    .then(limitMaximumSentences(maxSentences))
    .then(fetchKeywordsOfAllSentences)
}

function sanitizeContent(content) {
  content = removeBlankLinesAndMarkdown(content)
  return removeDatesInParentheses(content)
}

function removeBlankLinesAndMarkdown(text) {
  const allLines = text.split('\n')
  const withoutBlankLinesAndMarkdown = allLines.filter(
    line => line.trim() && !line.trim().startsWith('=')
  )
  return withoutBlankLinesAndMarkdown.join(' ')
}

function removeDatesInParentheses(text) {
  return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/\s{2,}/g, ' ')
}

function breakContentIntoSentences(content) {
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
        keywords: await fetchWatsonKeywords(sentence.text),
        ...sentence
      })
    )
  )
}

module.exports = {
  produceText
}
