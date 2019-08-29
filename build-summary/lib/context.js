const cookie = require('cookie')

const setContext = (res, context) => {
  const json = JSON.stringify(context)
  const contextCookie = cookie.serialize('context', json, { path: '/' })
  res.setHeader('set-cookie', contextCookie)
}

const getContext = req => {
  if (!req.cookies.context) {
    return {}
  }

  return JSON.parse(req.cookies.context)
}

const redirect = (res, url) => {
  res.setHeader('location', url)
  res.status(302).send('Redirecting...')
}

module.exports = { setContext, getContext, redirect }
