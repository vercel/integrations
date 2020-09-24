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
