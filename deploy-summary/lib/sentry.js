const Sentry = require('@sentry/node')

const SENTRY_DSN = process.env.SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV
  })
  console.log('SENTRY_DSN defined, sending errors to Sentry')
} else {
  console.log('SENTRY_DSN is not defined, not sending errors to Sentry')
}

const sendToSentry = err => {
  if (!SENTRY_DSN) return

  try {
    Sentry.captureException(err)
  } catch (error) {
    console.error(`Failed to report error to Sentry: ${error}`)
    console.error(`Error being reported: ${err}`)
  }
}

const withSentry = (functionName, fn) => {
  if (!SENTRY_DSN) return fn

  return async (...args) => {
    try {
      const result = await fn(...args)
      return result
    } catch (error) {
      Sentry.withScope(scope => {
        scope.setTag('functionName', functionName)
        sendToSentry(error)
      })

      if (!(await Sentry.flush(2000))) {
        console.log(`Timeout expired, failed to report error to Sentry`)
      }

      throw error
    }
  }
}

module.exports = { sendToSentry, withSentry }
