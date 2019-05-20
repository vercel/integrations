import { htm as html } from '@zeit/integration-utils'
import { Status } from '../components/Status';

export const CronJob = ({ cronJob }: { cronJob: any }) => {
  return html`
    <Box display="table-row" borderColor="#eaeaea" borderStyle="solid" borderBottomWidth="1px">
      <Box display="flex" justifyContent="center" padding="10px"><${Status} active=${Boolean(Number(cronJob.status))} /></Box>
      <Box display="table-cell" padding="10px"><P>${cronJob.cron_job_name}</P></Box>
      <Box display="table-cell" padding="10px"><Link href=${cronJob.url} target="_blank">${cronJob.url}</Link></Box>
      <Box display="table-cell" padding="10px"><P>${cronJob.cron_expression}</P></Box>
      <Box display="table-cell" padding="10px">
        <Button small secondary action=${`detail-${cronJob.cron_job_id}`}>
          Detail
        </Button>
      </Box>
    </Box>
  `
}

export const Logout = () => html`
  <Box width="100%" display="flex" justifyContent="flex-end" marginTop="20px">
    <P>You can change your API key <Link action="changeToken">here.</Link></P>
  </Box>  
`

export const CronJobs = ({ cronJobs }: { cronJobs: any[] }) => {
  if (cronJobs.length > 0) {
    return html`
      <Page>
        <Box display="flex" justifyContent="space-between">
          <H1>Cron jobs</H1>
          <Button small action="newCronJob">
            Create a new cron job
          </Button>
        </Box>
        <Box
          width="100%"
          display="table"
          borderRadius="5px"
          borderColor="#eaeaea"
          overflow="hidden"
          borderStyle="solid"
          borderWidth="1px"
          marginTop="20px"
          marginBottom="20px"
        >
          <Box display="table-header-group" backgroundColor="rgb(250, 250, 250)">
            <Box display="table-row">
              <Box display="table-cell" padding="10px" borderColor="#eaeaea" borderStyle="solid" borderWidth="0px" borderBottomWidth="1px"><P><B>Active</B></P></Box>
              <Box display="table-cell" padding="10px" borderColor="#eaeaea" borderStyle="solid" borderWidth="0px" borderBottomWidth="1px"><P><B>Name</B></P></Box>
              <Box display="table-cell" padding="10px" borderColor="#eaeaea" borderStyle="solid" borderWidth="0px" borderBottomWidth="1px"><P><B>Cron url</B></P></Box>
              <Box display="table-cell" padding="10px" borderColor="#eaeaea" borderStyle="solid" borderWidth="0px" borderBottomWidth="1px"><P><B>Cron expression</B></P></Box>
              <Box display="table-cell" padding="10px" borderColor="#eaeaea" borderStyle="solid" borderWidth="0px" borderBottomWidth="1px"><P><B>Action</B></P></Box>
            </Box>
          </Box>
          <Box display="table-row-group">
            ${cronJobs.map(
              cronJob =>
                html`
                  <${CronJob} cronJob=${cronJob} />
                `,
            )}
          </Box>
        </Box>
        <${Logout} />
      </Page>
    `
  } else {
    return html`
      <Page>
        <H1>Cron jobs</H1>
        <Box
          width="100%"
          minHeight="300px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="5px"
          borderColor="#eaeaea"
          borderStyle="solid"
          borderWidth="1px"
          marginTop="20px"
          marginBottom="20px"
        >
          <Button small action="newCronJob">
            Create a new cron job
          </Button>
        </Box>
        <${Logout} />
      </Page>
    `
  }
}
