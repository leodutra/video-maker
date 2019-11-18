const prepareContent = require('../lib/text/prepareContent')

module.exports =
async function textRobot({ searchTerm, lang, wikipediaApi, credentials, qtySentences = MAX_SENTENCES }) {
    return prepareContent({ searchTerm, lang, wikipediaApi, credentials, qtySentences })
}
