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
