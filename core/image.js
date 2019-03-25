const { searchImages } = require('../apis/google-images')

async function searchTextImages({ searchTerm, sentences }) {
  return Promise.all(
    sentences.map(async sentence => {
      const googleSearchQuery = `${searchTerm} ${sentence.keywords[0]}`
      return {
        googleSearchQuery,
        images: await searchImages(googleSearchQuery),
        ...sentence
      }
    })
  )
}

module.exports = {
  searchTextImages
}
