


const { SuggestionService, suggestSearchTerms } = require('./core/lib/input/suggestions')

module.exports = {
    input: {
        Language: require('./core/lib/input/Language'),
        prefixes: require('./core/lib/input/prefixes'),
        SuggestionService,
        suggestSearchTerms,
    },
    text: {
        propareContent: require('./core/lib/text/prepareContent'),
    },
    image: {
        propareContent: require('./core/lib/text/prepareContent')
    },
}