import fetch from 'node-fetch'

class EasyCron {
  private apiKey: string
  private endpoint: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.endpoint = `https://www.easycron.com/rest`
  }

  async upsertJob({ id, clientState }: { id: number; clientState: any }) {
    const {
      cron_job_name,
      cron_expression,
      timezone,
      http_method,
      posts,
      path,
    } = clientState

    let { url } = clientState

    url = `${url.match(/^https:\/\//) ? url : `https://${url}/`}${path}`

    let uri = `${this.endpoint}/${id ? 'edit' : 'add'}?token=${
      this.apiKey
    }${id? `&id=${id}` : ''}&cron_job_name=${cron_job_name}&url=${url}&cron_expression=${cron_expression}&timezone_from=2&timezone=${timezone}&http_method=${http_method}`

    if (posts !== '') {
      uri += `&posts=${posts}`
    }

    const { cron_job_id, error } = await fetch(encodeURI(uri), {
      method: 'POST',
    }).then(reponse => reponse.json())
    return { error, cron_job_id }
  }

  async getJobs() {
    const { cron_jobs, error } = await fetch(
      `${this.endpoint}/list?token=${this.apiKey}&limit=100`,
    ).then(reponse => reponse.json())

    return { error, cronJobs: cron_jobs }
  }

  async getDetail(id: number) {
    const { cron_job } = await fetch(
      `${this.endpoint}/detail?token=${this.apiKey}&id=${id}`,
    ).then(reponse => reponse.json())

    return cron_job
  }

  async getLogs(id: number) {
    const { logs } = await fetch(
      `${this.endpoint}/logs?token=${this.apiKey}&id=${id}`,
    ).then(reponse => reponse.json())

    return logs
  }

  async deleteJob(id: number) {
    const { status } = await fetch(
      `${this.endpoint}/delete?token=${this.apiKey}&id=${id}`,
    ).then(reponse => reponse.json())

    return status
  }

  async enable(id: number) {
    const { status } = await fetch(
      `${this.endpoint}/enable?token=${this.apiKey}&id=${id}`,
    ).then(reponse => reponse.json())

    return status
  }

  async disable(id: number) {
    const { status } = await fetch(
      `${this.endpoint}/disable?token=${this.apiKey}&id=${id}`,
    ).then(reponse => reponse.json())

    return status
  }

  async timezone() {
    const { timezone, error } = await fetch(
      `${this.endpoint}/timezone?token=${this.apiKey}`,
    ).then(reponse => reponse.json())

    return { timezone, error }
  }
}

export default EasyCron
