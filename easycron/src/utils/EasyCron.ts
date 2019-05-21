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
      url
    } = clientState

    console.log(url)


    const endpoint = `${path === '' ? `https://${url}` : `https://${url}/${path}`}`

    console.log(endpoint)

    let uri = `${this.endpoint}/${id ? 'edit' : 'add'}?token=${
      this.apiKey
    }${id? `&id=${id}` : ''}&cron_job_name=${cron_job_name}&url=${endpoint}&cron_expression=${cron_expression}&timezone_from=2&timezone=${timezone}&http_method=${http_method}`

    if (posts !== '') {
      uri += `&posts=${posts}`
    }

    console.log(uri)

    const { cron_job_id, error } = await fetch(encodeURI(uri), {
      method: 'POST',
    }).then(reponse => reponse.json())
    return { cron_job_id, error }
  }

  async getJobs() {
    const { cron_jobs, error } = await fetch(
      `${this.endpoint}/list?token=${this.apiKey}&limit=100`,
    ).then(reponse => reponse.json())

    return { cronJobs: cron_jobs, error }
  }

  async getDetail(id: number) {
    const { cron_job, error } = await fetch(
      `${this.endpoint}/detail?token=${this.apiKey}&id=${id}`,
    ).then(reponse => reponse.json())

    return { cron_job, error }
  }

  async getLogs(id: number) {
    const { logs, error } = await fetch(
      `${this.endpoint}/logs?token=${this.apiKey}&id=${id}`,
    ).then(reponse => reponse.json())

    return { logs, error }
  }

  async deleteJob(id: number) {
    const { error } = await fetch(
      `${this.endpoint}/delete?token=${this.apiKey}&id=${id}`,
    ).then(reponse => reponse.json())

    return { error }
  }

  async enable(id: number) {
    const { error } = await fetch(
      `${this.endpoint}/enable?token=${this.apiKey}&id=${id}`,
    ).then(reponse => reponse.json())

    return { error }
  }

  async disable(id: number) {
    const { error } = await fetch(
      `${this.endpoint}/disable?token=${this.apiKey}&id=${id}`,
    ).then(reponse => reponse.json())

    return { error }
  }

  async timezone() {
    const { timezone, error } = await fetch(
      `${this.endpoint}/timezone?token=${this.apiKey}`,
    ).then(reponse => reponse.json())

    return { timezone, error }
  }
}

export default EasyCron
