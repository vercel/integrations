const rp = require('request-promise')

let GLOBAL_META_STORAGE = null

const checkAndLoadMetadata = async ({ zeitClient, payload }) => {
  if (GLOBAL_META_STORAGE) return GLOBAL_META_STORAGE
  const metaStorage = await zeitClient.getMetadata()

  if (Object.keys(metaStorage).length === 0) {
    GLOBAL_META_STORAGE = await initializeMetaData(payload)
    await zeitClient.setMetadata(GLOBAL_META_STORAGE)
    return GLOBAL_META_STORAGE
  }

  GLOBAL_META_STORAGE = metaStorage
  return GLOBAL_META_STORAGE
}

const initializeMetaData = async ({ query }) => {
  if (!query.code) {
    throw new Error('Missing OAuth code')
  }
  const options = {
    method: 'POST',
    uri: 'https://api.zeit.co/v2/oauth/access_token',
    form: {
      code: query.code,
      client_id: process.env.zeit_client_id,
      client_secret: process.env.zeit_client_secret,
      redirect_uri: process.env.zeit_redirect_uri
    }
  }

  try {
    const response = await rp(options)
    const responseJson = JSON.parse(response)
    return {
      deployments: [],
      access_token: responseJson.access_token
    }
  } catch ({ error }) {
    throw new Error('Failed to generate token')
  }
}

const saveDeployment = async ({ zeitClient }, deployment) => {
  GLOBAL_META_STORAGE.deployments.push(deployment)
  await zeitClient.setMetadata(GLOBAL_META_STORAGE)
}

const deleteDeployment = async ({ zeitClient }, deployment) => {
  GLOBAL_META_STORAGE.deployments = [...GLOBAL_META_STORAGE.deployments.filter(({ id }) => id !== deployment.id)]
  await zeitClient.setMetadata(GLOBAL_META_STORAGE)
}

module.exports = {
  checkAndLoadMetadata,
  saveDeployment,
  deleteDeployment,
  GLOBAL_META_STORAGE
}
