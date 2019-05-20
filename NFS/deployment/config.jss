const isNow = process.env.NOW_REGION

const config = () => {
 const configObject = {
    bucket_name: process.env.bucket_name,
    access_key: process.env.access_key,
    secret_key: process.env.secret_key,
    region: process.env.region,
    endpoint: process.env.endpoint,
    expires_get: Number(process.env.expires_get) || 60 * 60 * 24, //1 day
    expires_post: Number(process.env.expires_post) || 60 * 10, // 10 min
    max_size: Number(process.env.max_size) || 80000000,  // 10MB
    min_size: Number(process.env.min_size) || 8000, // 1KB
  }

  Object.keys(configObject).map(key => {
    if (!configObject[key]) throw new Error()
  })

  return configObject
}

module.exports = config()
