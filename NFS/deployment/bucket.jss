const config = require('./config')
const aws = require('aws-sdk')
const {createError, send, json} = require('micro')
const { randomBytes } = require('crypto')
const mime = require('mime-types')

const endpoint = new aws.Endpoint(config.endpoint)

aws.config.update({
  'accessKeyId': config.access_key,
  'secretAccessKey': config.secret_key,
  'region': config.region,
  'endpoint': endpoint
})

// Set AWS to use native promises
aws.config.setPromisesDependency(null)

// New S3 class
const s3 = new aws.S3()

/**
 * This function retrieves a signed URL.
 * It is useful to programatically restrict access to some objects.
 * to S3 objects, like private files.
 * @param  {req}    req object from micro
 * @param  {res}    res object from micro
 * @return {String} URL response from S3
 */
const getSignedS3 = async (req, res) => {
  const s3key = `${req.url.split('/').pop()}`

  const params = {
    Bucket: config.bucket_name,
    Key: s3key,
    Expires: config.expires_get // 1 day
  }

  try {
    // key exists?
    await s3.headObject({
      Bucket: params.Bucket,
      Key: params.Key
    }).promise()

    // if you want to programatically provide limited access to an S3 object:
    // const url = await s3.getSignedUrl('getObject', params)
    // return send(res, statusCode, url)

    // we will use Now 2.0 bultin CDN bellow
    const result = await s3.getObject(params).promise()
    return send(res, 200, result.data)
  } catch (err) {
    if (err.statusCode === 404) {
      throw createError(404, 'Not Found')
    } else throw err
  }
}

/**
 * This function retrieves and object and serves
 * content with headers aimed for the CDN.
 * @param  {req}    req object from micro
 * @param  {res}    res object from micro
 * @return {String} URL response from S3
 */
const getS3 = async (req, res) => {
  const s3key = `${req.url.split('/').pop()}`

  const params = {
    Bucket: config.bucket_name,
    Key: s3key
  }

  try {
    // key exists?
    await s3.headObject(params).promise()

    // cache headers
    res.setHeader('Cache-Control', 'immutable, s-maxage=31536000, maxage=0')
    // retrieving object from S3
    const result = await s3.getObject(params).promise()
    // set the right Content-Type
    res.setHeader('Content-Type', result['ContentType'])

    return send(res, 200, result.Body)
  } catch (err) {
    if (err.statusCode === 404) {
      throw createError(404, 'Not Found')
    } else throw err
  }
}

/**
 * This function can generate a UUID of any size.
 * Example of UUID: "I1tx0ssVk9"
 * @param  {Number} Size of UUID
 * @return {String} UUID generated
 */
const generateUUID = (size = 10) => {
  return randomBytes(Math.ceil(size * 3 / 4))
    .toString('base64')
    .slice(0, size)
    .replace(/\+/g, 'a')
    .replace(/\//g, 'b')
}

/**
 * This function will generate a post request to a S3 bucket
 * @param  {req}    req object from micro
 * @param  {res}    res object from micro
 * @return {String} Object response from S3
 */
const postS3 = async (req, res) => {
  let {filename: fileName, contenttype: contentType} = await json(req) // we are requiring the ContentType from the request

  if (!fileName) {
    throw createError(400, 'filename or contenttype must be set')
  }

  if (!contentType) {
    contentType = mime.lookup(fileName)
  }

  const s3key = `${generateUUID()}`

  const params = {
    Bucket: config.bucket_name,
    Fields: {
      key: s3key
    },
    Expires: config.expires_post, // 10 min
    Conditions: [
      {
        'bucket': config.bucket_name
      },
      {
        'key': s3key // our generated key
      },
      {
        'acl': 'private' // private bucket
      },
      {
        'Content-Type': contentType
      },
      ['content-length-range', 8000, 8000000] // from 1KB to 1 MB
    ]
  }

  let signedPost = await s3.createPresignedPost(params)
  signedPost = Object.assign(signedPost,
    {
      'Content-Type': contentType,
      'acl': 'private'
    }
  )
  return send(res, 200, signedPost)
}

module.exports = {
  getS3,
  postS3
}
