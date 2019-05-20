const rp = require('request-promise')
const fs = require('fs')
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)

const DEPLOYMENT_PATH = `${__dirname}/../../deployment`

const deploy = async (clientData, token) => {
  const names = fs
    .readdirSync(DEPLOYMENT_PATH)
    .filter(name => !name.startsWith('.'))

  const { alias } = clientData
  delete clientData.alias

  const files = []
  for (const name of names) {
    const file = {}
    file.file = name.endsWith('jss') ? name.slice(0, -1) : name
    file.encoding = 'utf-8'
    file.data = await readFileAsync(`${DEPLOYMENT_PATH}/${name}`, 'utf8')
    files.push(file)
  }

  const options = {
    method: 'POST',
    uri: 'https://api.zeit.co/v8/now/deployments',
    body: {
      name: 'nfs-integration',
      files,
      alias,
      env: clientData,
      version: 2,
      builds: [
        { src: '/get.js', use: '@now/node' },
        { src: '/post.js', use: '@now/node' }
      ],
      routes: [
        { src: '/', methods: ['POST'], dest: '/post.js' },
        { src: '/(.+)', methods: ['GET'], dest: '/get.js' }
      ],
      target: 'production'
    },
    headers: {
      'Authorization': `Bearer ${token}`
    },
    json: true
  }

  try {
    const result = await rp(options)
    return result
  } catch ({ error }) {
    console.error('Failed to POST', error)
    return error.error
  }
}

const nuke = async ({ id }, token) => {
  console.info(id, token)
  const options = {
    method: 'DELETE',
    uri: `https://api.zeit.co//v8/now/deployments/${id}`,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }

  try {
    const result = await rp(options)
    return result
  } catch ({ error }) {
    console.error('Failed to DELETE', error)
    return error.error
  }
}

const get = async ({ id }, token) => {
  const options = {
    method: 'GET',
    uri: `https://api.zeit.co/v8/now/deployments/${id}`,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }

  try {
    const result = await rp(options)
    return result
  } catch ({ error }) {
    console.error('Failed to GET', error)
    return error
  }
}

module.exports = {
  deploy,
  nuke,
  get
}
