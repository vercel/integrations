import { withUiHook, htm as html } from '@zeit/integration-utils'
import { Login } from './views/Login'
import { CronJobs } from './views/CronJobs'
import EasyCron from './utils/EasyCron'
import { UpsertJob } from './views/UpsertJob'
import { InvalidToken } from './views/InvalidToken'
import uniq from 'lodash.uniq'
import { filterCronJobs } from './utils/filter'

export default withUiHook(
  async ({ zeitClient, payload }): Promise<string> => {
    const store = await zeitClient.getMetadata()
    const { action } = payload
    let { clientState, projectId } = payload

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
    }

    const { deployments } = await zeitClient.fetchAndThrow(apiUrl, {
      method: 'GET',
    })

    if (action === 'createCronJob' || action.match(/^updateJob/)) {
      const result = await client.upsertJob({ id, clientState })
      const { cron_job_id } = result

      if (!projectId) {
        // filter deployments by url and get name
        const deployment = deployments.filter(
          (d: any) => (d.url = clientState.url),
        )[0]
        const { id } = await zeitClient.fetchAndThrow(
          `/v1/projects/${deployment.name}`,
          {
            method: 'GET',
          },
        )
        projectId = id
      }

      // Set jobId to projectId FACEPALM CODE :D no time to be fancy :D
      if (projectId) {
        if (store.projects) {
          const project = store.projects[projectId]
          store.projects[projectId] = project
            ? uniq([...project, cron_job_id])
            : [cron_job_id]
        } else {
          store.projects = {
            [projectId]: [cron_job_id],
          }
        }
      }
      await zeitClient.setMetadata(store)
    }

    if (
      action === 'newCronJob' ||
      action.match(/^detail-/) ||
      action.match(/^jobEnable-/) ||
      action.match(/^jobDisable-/)
    ) {
      if (action === 'newCronJob') {
        return html`
          <${UpsertJob} clientState=${clientState} deployments=${deployments}  />
        `
      } else {
        const [detail, logs, {timezone}] = await Promise.all([
          client.getDetail(id),
          client.getLogs(id),
          client.timezone()
        ])

        clientState = detail
        const parsedUrl = detail.url.match(/(https:\/\/[^\/]*\/?)(.*)/)
        clientState.url = parsedUrl[1]
        clientState.path = parsedUrl[2] || ''
 
        return html`
          <${UpsertJob}
            id=${id}
            logs=${logs}
            clientState=${clientState}
            deployments=${deployments}
            timezone=${timezone}
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
        <${CronJobs} cronJobs=${filterCronJobs(projectId, store.projects, cronJobs)} />
      `
    }
  },
)
