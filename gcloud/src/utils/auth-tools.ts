import { IncomingMessage, ServerResponse } from "http"
import cookie from 'cookie'
import ms from 'ms'

export function toB64(val: string | any): string {
  if (typeof val === 'string') {
    return Buffer.from(val).toString('base64')
  }

  return Buffer.from(JSON.stringify(val)).toString('base64')
}

export function fromB64(string: string): string {
  return Buffer.from(string, 'base64').toString()
}

export function getContext(req: IncomingMessage, res: ServerResponse): any {
  const cookieValue = cookie.parse(req.headers.cookie || '')['zeit_context']
  if (!cookieValue) {
    return {}
  }

  try {
    res.setHeader('Set-Cookie', '')
    return JSON.parse(fromB64(cookieValue))
  } catch (e) {
    res.setHeader('Set-Cookie', '')
    return {}
  }
}

export function setContext(res: ServerResponse, context: any): void {
  res.setHeader('Set-Cookie', cookie.serialize('zeit_context', context, {
    httpOnly: true,
    path: '/',
    expires: new Date(Date.now() + ms('24h'))
  }))
}
