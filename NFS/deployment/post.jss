const { handleErrors } = require('./error')
const { postS3 } = require('./bucket')

module.exports = handleErrors(postS3)
