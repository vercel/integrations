import { ServerResponse } from 'http'

export default function redirect(res: ServerResponse, to: string): void {
  res.statusCode = 302
  res.setHeader('Location', to)
  res.end()
}