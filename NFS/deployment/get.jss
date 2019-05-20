const { handleErrors } = require('./error')
const { getS3 } = require('./bucket')

module.exports = handleErrors(getS3)