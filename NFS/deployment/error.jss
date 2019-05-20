const { send } = require('micro')

// Error handling
const handleErrors = fn => async (req, res) => {
  try {
    return await fn(req, res)
  } catch (err) {
    const statusCode = err.statusCode || 500
    const message = err.message || 'Internal Server Error'
    console.error(err)
    return send(res, statusCode, message)
  }
}

module.exports = {
  handleErrors
}
