const fetch = require('../fetch')
const Octokit = require('@octokit/rest')
const qs = require('querystring')

module.exports = {
  // OAUTH FLOW
  getAuthorizeEndpoint() {
    return (
      'https://github.com/login/oauth/authorize?' +
      qs.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        scope: 'repo'
      })
    )
  },
  async getToken(code) {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: qs.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code
      })
    })

    if (!res.ok) throw new Error()

    return (await res.json()).access_token
  },

  // GITHUB API BRIDGE
  async createClient(token) {
    const client = Octokit({ auth: token })

    // if the token is not valid anymore (user did revoke)
    // we return a null client
    try {
      await client.users.getAuthenticated()
      return client
    } catch (error) {
      if (error.status && [401, 403].includes(error.status)) return null
      throw error
    }
  },
  async getUser(client) {
    const { data: user } = await client.users.getAuthenticated()
    if (!user) return null
    return {
      id: user.id,
      username: user.login,
      avatar: user.avatar_url,
      settings: `https://github.com/settings/connections/applications/${process.env.GITHUB_CLIENT_ID}`
    }
  },
  async getPull(client, { meta }) {
    const {
      data: [pull]
    } = await client.pulls.list({
      owner: meta.githubOrg,
      repo: meta.githubRepo,
      head: `${meta.githubCommitOrg}:${meta.githubCommitRef}`,
      state: 'open'
    })
    return pull
  },
  async getDiff(client, { meta, pull }) {
    const { data: comparison } = await client.repos.compareCommits({
      owner: meta.githubOrg,
      repo: meta.githubRepo,
      base: pull.base.ref,
      head: `${meta.githubCommitOrg}:${meta.githubCommitSha}`
    })

    const deleted = []
    const modified = []

    for (let file of comparison.files) {
      if (file.status === 'removed') {
        deleted.push(file.filename)
      } else {
        modified.push(file.filename)
      }
    }

    return { deleted, modified }
  },
  async upsertComment(client, { meta, pull, body }) {
    const { data: comments } = await client.issues.listComments({
      owner: meta.githubOrg,
      repo: meta.githubRepo,
      issue_number: pull.number
    })

    const comment = comments.find(comment =>
      comment.body.startsWith('#### 📝Changed routes:')
    )

    if (!comment) {
      await client.issues.createComment({
        owner: meta.githubOrg,
        repo: meta.githubRepo,
        issue_number: pull.number,
        body
      })
    } else {
      await client.issues.updateComment({
        owner: meta.githubOrg,
        repo: meta.githubRepo,
        comment_id: comment.id,
        body
      })
    }
  },
  getCommitShaFromMeta(meta) {
    return meta.githubCommitSha
  }
}
