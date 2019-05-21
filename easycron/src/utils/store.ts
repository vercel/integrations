import uniq from 'lodash.uniq'

interface Projects {
  [projectId: string]: string[]
}

interface Store {
  projects: Projects
}

export const getProjectId = ({ projects }: Store, cronJobId: string) => {
  if (projects) {
    for (const key in projects) {
      if (projects.hasOwnProperty(key)) {
        const project = projects[key]
        if (project.indexOf(cronJobId) > -1) {
          return key
        }
      }
    }
  }
  return undefined
}

export const saveProject = (store: Store, projectId: string, cronJobId: string) => {
  if (store.projects) {
    const project = store.projects[projectId]
    store.projects[projectId] = project
      ? uniq([...project, cronJobId])
      : [cronJobId]
  } else {
    store.projects = {
      [projectId]: [cronJobId],
    }
  }
}

export const filterCronJobs = (
  projectId: string | undefined | null,
  projects: any,
  cronJobs: [],
) => {
  if (!projects || !projectId) {
    return cronJobs
  } else if (projects && projectId && !projects[projectId]) {
    return []
  } else {
    //Filter project Ids
    const cronIds = projects[projectId]

    return cronJobs.filter((job: any) => cronIds.indexOf(job.cron_job_id) > -1)
  }
}
