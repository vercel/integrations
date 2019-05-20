/**
 * NOTE: This code implements OAuth authentication with full access to GCP
 * However Google refused to approve the integration because `cloud-platform` OAuth scope is "too broad"
 * They said we should use service accounts instead since there aren't any less broad scopes, so
 * until we can convince Google that we really want OAuth, I'm gonna leave this code here unused
 */

import { IncomingMessage, ServerResponse } from 'http'
import { parse } from 'url'
import qs from 'querystring'
import { send } from 'micro'
import { google } from 'googleapis'
import redirect from '../utils/redirect'
import { setContext, getContext } from '../utils/auth-tools';
import ZEIT from '../utils/zeit-api';

const { CLIENT_ID, CLIENT_SECRET, BASE_URL } = process.env
const REDIRECT_URL = `${BASE_URL}/connect`

async function connect(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!req.url) {
    return send(res, 400, { code: 'bad_request' })
  }

  const { query } = parse(req.url)
  let code
  let context
  if (query) {
    const parsed = qs.parse(query)
    code = parsed.code
    context = parsed.context ? decodeURIComponent(parsed.context as string) : null
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL,
  )

  if (!code) {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // 'offline', since we need refresh token
      scope: 'https://www.googleapis.com/auth/cloud-platform' // We only need once scope
    })

    setContext(res, context)
    return redirect(res, url)
  }

  const { tokens } = await oauth2Client.getToken(code as string)

  context = getContext(req, res)
  await ZEIT.saveMetadata({
    auth: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    }
  }, context.token, context.teamId)

  // Close the window once done
  return send(res, 200, `
    <html>
      <head></head>
      <body>
      <script>this.close()</script>
      </body>
    </html>
  `)
}

export default connect