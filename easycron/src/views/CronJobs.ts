import { htm as html } from '@zeit/integration-utils'
import { Status, Method } from '../components/Status';
import { TableRow, BodyItem, Table, HeaderItem } from '../components/Table';

export const CronJob = ({ cronJob }: { cronJob: any }) => {
  return html`
    <${TableRow}>
      <${BodyItem}>${cronJob.cron_job_name}</${BodyItem}>
      <Box display="flex" padding="10px"><${Method}>${cronJob.http_method}</${Method}></Box>      
      <${BodyItem}><Link href=${cronJob.url} target="_blank">${cronJob.url}</Link> <${Status} active=${Boolean(Number(cronJob.status))} /></${BodyItem}>
      <${BodyItem}>${cronJob.cron_expression}</${BodyItem}>
      <${BodyItem}>
        <Button small secondary action=${`detail-${cronJob.cron_job_id}`}>
          Detail
        </Button>
      </${BodyItem}>
    </${TableRow}>
  `
}

export const Logout = () => html`
  <Box width="100%" display="flex" justifyContent="space-between" alignItems="center" marginTop="20px">
    <ProjectSwitcher />
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
        <${Table} header=${html`
            <${HeaderItem}>Name</${HeaderItem}>
            <${HeaderItem}>Method</${HeaderItem}>
            <${HeaderItem}>Url</${HeaderItem}>
            <${HeaderItem}>Cron expression</${HeaderItem}>
            <${HeaderItem}>Action</${HeaderItem}>
          `}
        >      
          ${cronJobs.map(
            cronJob =>
              html`
                <${CronJob} cronJob=${cronJob} />
              `,
          )}
        </${Table}>
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
          backgroundColor="white"
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
