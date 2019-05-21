import { withUiHook, htm as html } from '@zeit/integration-utils'
import { Login } from './views/Login'
import { CronJobs } from './views/CronJobs'
import EasyCron from './utils/EasyCron'
import { UpsertJob } from './views/UpsertJob'
import { InvalidToken } from './views/InvalidToken'
import { getProjectId, filterCronJobs, saveProject } from './utils/store'

export default withUiHook(
  async ({ zeitClient, payload }): Promise<string> => {
    const store = await zeitClient.getMetadata()
    const { action, projectId } = payload
    let { clientState } = payload
    let upsertError

    if (action === 'setToken') {
      store.apiToken = clientState.apiToken
      await zeitClient.setMetadata(store)
    }

    if (action === 'changeToken') {
      store.apiToken = ''
      await zeitClient.setMetadata(store)
    }

    if (!store.apiToken || store.apiToken === '') {
      return html`
        <${Login} apiToken=${store.apiToken || ''} />
      `
    }

    const match = action.match(/(\d*)$/)

    // Match job ID or use 0
    const id = (match && Number(match[1])) || 0

    const client = new EasyCron(store.apiToken)

    if (action.match(/^deleteJob-/)) {
      await client.deleteJob(id)
    }

    if (action.match(/^jobEnable-/)) {
      await client.enable(id)
    }

    if (action.match(/^jobDisable-/)) {
      await client.disable(id)
    }

    let apiUrl = `/v4/now/deployments?limit=10`
    if (projectId) {
      apiUrl += `&projectId=${projectId}`
    } else if (id && !projectId) {
      const projectId = getProjectId(store, `${id}`)
      if (projectId) {
        apiUrl += `&projectId=${projectId}`
      }
    }

    const { deployments } = await zeitClient.fetchAndThrow(apiUrl, {
      method: 'GET',
    })

    if (action === 'createCronJob' || action.match(/^updateJob/)) {
      const { cron_job_id, error } = await client.upsertJob({ id, clientState })
      let updateId = projectId
      upsertError = error

      if (!updateId) {
        // filter deployments by url and get name
        const deployment = deployments.filter(
          (d: any) => (d.url === clientState.url),
        )[0]
        const { id } = await zeitClient.fetchAndThrow(
          `/v1/projects/${deployment.name}`,
          {
            method: 'GET',
          },
        )
        updateId = id as string
      }

      // Set jobId to projectId FACEPALM CODE :D no time to be fancy :D
      saveProject(store, updateId, cron_job_id)
      await zeitClient.setMetadata(store)
    }

    if (
      action === 'newCronJob' ||
      action.match(/^detail-/) ||
      action.match(/^jobEnable-/) ||
      action.match(/^jobDisable-/) ||
      upsertError
    ) {
      if (action === 'newCronJob' || upsertError) {
        return html`
          <${UpsertJob}
            clientState=${clientState}
            deployments=${deployments}
            error=${upsertError}
          />
        `
      } else {
        const [
          { cron_job: detail, error },
          { logs },
          { timezone },
        ] = await Promise.all([
          client.getDetail(id),
          client.getLogs(id),
          client.timezone(),
        ])

        clientState = detail
        const parsedUrl = detail.url.match(/https:\/\/([^\/]*)\/?(.*)/)
        clientState.url = parsedUrl[1]
        clientState.path = parsedUrl[2] || ''

        return html`
          <${UpsertJob}
            id=${id}
            logs=${logs}
            clientState=${clientState}
            deployments=${deployments}
            timezone=${timezone}
            error=${upsertError || error}
          />
        `
      }
    }

    const { error, cronJobs } = await client.getJobs()

    if (error) {
      return html`
        <${InvalidToken} />
      `
    } else {
      return html`
        <${CronJobs}
          cronJobs=${filterCronJobs(projectId, store.projects, cronJobs)}
        />
      `
    }
  },
)
