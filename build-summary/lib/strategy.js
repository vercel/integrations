module.exports = provider => {
  switch (provider) {
    case 'github':
      return require('./providers/github')
    case 'gitlab':
      return require('./providers/gitlab')
    default:
      throw new Error('Provider not found')
  }
}

// add createClient(provider) {} method
// that creates a client for the provider
// and sends a getUser() request
// and if it doesn't succeed, remove appropriate token from store
// also the webhook should peacefully handle it (to avoid retrying)

// no actually make createClient do that (because it depends on the provider)
// if(res.status === 403) ...
