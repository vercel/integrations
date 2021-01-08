module.exports = async function ({
  metadata,
  zeitClient
}) {
  let endpoint = `/v9/now/deployments`
  let inputs = metadata.inputs
  const res = await zeitClient.fetchAndThrow(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      name: metadata.projectName,
      version: 2,
      builds: [
        { src: "package.json", use: "@now/static-build" },
        { src: "api/*.js", use: "@now/node" }
      ],
      routes: [
        { src: "/api", dest: "/api/index.js" }
      ],
      env: {
        AIRTABLE_KEY: metadata.apiKey,
        AIRTABLE_BASE: metadata.baseName,
        AIRTABLE_TABLE: metadata.tableName
      },
      files: [
        {
          file: 'pages/index.mdx',
          data: `
import Form from '../components/form'
import Head from 'next/head'
import '../style.css'
<Head>
  <title>${metadata.projectName}</title>
  <meta charSet="utf-8"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</Head>
` + metadata.content + '\n\n<Form/>'
        },
        {
          file: 'components/form.js',
          data: `
import {useState} from 'react'
import fetch from 'isomorphic-fetch'
export default () => {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
${inputs.map((input, index) => {
            return `  const [field${index}, setField${index}] = useState('')\n`
          }).join('')}
  const send = async (e) => {
    e.preventDefault()
    if (sent || loading) return
    setLoading(true)
    const res = await fetch('/api', {
      method: 'POST',
      body: JSON.stringify({
        ${inputs.map((input, index) => {
            if (input.type === 'checkbox') {
              return `"${input.label}": !!field${index},`
            }
            return `"${input.label}": field${index},`
          }).join('')}
      })
    })
    setLoading(false)
    if (res.status !== 200) {
      setError('Failed to send the data, please retry later.')
    } else {
      setError(null)
      setSent(true)
    }
  }
  return <form onSubmit={send}><div>
${inputs.map((input, index) => {
            if (input.type === 'input') {
              return `    <div><input type="text" placeholder="${input.label}" value={field${index}} onChange={e => setField${index}(e.target.value)}/></div>`
            }
            if (input.type === 'textarea') {
              return `    <textarea value={field${index}} onChange={e => setField${index}(e.target.value)} placeholder="${input.label}"></textarea>`
            }
            if (input.type === 'checkbox') {
              return `    <label><input type="checkbox" checked={!!field${index}} onChange={e => setField${index}(e.target.checked)}/><span> ${input.label}</span></label>`
            }
          }).join('')}
    <br/><br/>
    <button disabled={sent || loading} onClick={send}>{sent ? 'Submitted ✓' : loading ? 'Submitting...' : 'Submit'}</button>
    {error ? <p style={{
      color: 'red',
      marginTop: 10,
      fontSize: '.9em'
    }}>{error}</p> : null}
  </div></form>
}
          `
        },
        {
          file: 'api/index.js',
          data: `
const {parse} = require('url')
const {json, send} = require('micro')
const fetch = require('isomorphic-fetch')
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return send(res, 501, {
      error: {
        code: 'method_unknown',
        message: 'This endpoint only responds to POST'
      }
    })
  }
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  const body = await json(req)
  
  const airRes = await fetch(
    'https://api.airtable.com/v0/' + process.env.AIRTABLE_BASE + '/' + process.env.AIRTABLE_TABLE,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.AIRTABLE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: body
      })
    }
  )
  if (airRes.ok) {
    return send(res, 200, {})
  }
  send(res, 400, {
    error: {
      code: 'unknown_error',
      message: 'Failed to send data.'
    }
  })
}
`
        },
        {
          file: 'style.css',
          data: `body{font-family:"SF Pro Text","SF Pro Icons","Helvetica Neue",Helvetica,Arial,sans-serif;padding:20px 20px 60px;max-width:680px;margin:0 auto;font-size:16px;line-height:1.65;word-break:break-word;font-kerning:auto;font-variant:normal;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;hyphens:auto}h2,h3,h4{margin-top:1.5em}a{cursor:pointer;color:#0076ff;text-decoration:none;transition:all .2s ease;border-bottom:1px solid #fff}a:hover{border-bottom:1px solid #0076ff}ol,ul{padding:0;margin-left:1.5em}ul{list-style-type:none}li{margin-bottom:10px}ul li:before{content:'–'}li:before{display:inline-block;color:#999;position:absolute;margin-left:-18px;transition:color .2s ease}code,pre{font-family:Menlo,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New,monospace,serif;font-size:.92em;color:#d400ff}code:after,code:before{content:'\`'}blockquote{margin:1.6em 0;padding:5px 24px;background:#efefef}button,input,textarea{margin:0;border:1px solid #d1d1d1;border-radius:5px;padding:.5em;vertical-align:middle;white-space:normal;background:0 0;line-height:1;font-size:1rem;font-family:inherit}button{padding:.65em 1em;background:#0076ff;color:#fff;border:none;cursor:pointer;text-transform:uppercase}button:focus,input:focus,textarea:focus{outline:0;border-color:#0076ff}button:hover{background:rgba(0,118,255,.8)}button:focus{box-shadow:0 0 0 2px rgba(0,118,255,.5)}button:disabled{pointer-events:none;background:#999}img{max-width:100%}textarea{min-height:300px;width:100%;resize:none;margin:.7em 0;box-sizing:border-box}input,label{margin:.7em 0}label{display:block}label span{vertical-align:middle;margin: .7em 3px}hr{border:none;border-bottom:1px solid #efefef;margin:6em auto}`
        },
        {
          file: 'next.config.js',
          data: `
const withMDX = require('@zeit/next-mdx')()
const withCSS = require('@zeit/next-css')
module.exports = withCSS(withMDX({
  pageExtensions: ['mdx', 'js']
}))
          `
        },
        {
          file: 'package.json',
          data: `
{
  "scripts": {
    "now-build": "next build && next export -o dist",
    "dev": "next"
  },
  "dependencies": {
    "@mdx-js/mdx": "^0.17.5",
    "@zeit/next-css": "^1.0.1",
    "@zeit/next-mdx": "^1.2.0",
    "isomorphic-fetch": "^2.2.1",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  }
}
          `
        },
        {
          file: 'api/package.json',
          data: `
{
  "dependencies": {
    "isomorphic-fetch": "^2.2.1",
    "micro": "^9.3.3"
  }
}
          `
        }
      ]
    })
  })
  return res
}
