import { htm as html } from '@zeit/integration-utils'
import ms from 'ms'
import { Note, StatusDot } from '../components';
import { cloudscheduler_v1beta1 } from 'googleapis';
import { fromB64 } from '../../auth-tools';
import { timezones } from '../scheduler-data';

interface SchedulerFieldsetProps {
  jobs: cloudscheduler_v1beta1.Schema$Job[];
  error?: string | null;
  disabled?: boolean;
  deployments: any[];
}

const Job = ({ job }: { job: cloudscheduler_v1beta1.Schema$Job }) => {
  const [, name] = (job.name as string).split('/jobs/')

  /* eslint-disable no-irregular-whitespace */
  return html`
    <Box display="flex" flexDirection="column" border="1px solid #eaeaea" borderRadius="5px" padding="10px" marginBottom="20px">
      <B>${name}</B>
      ${job.description ? html`<P>${job.description}</P>` : ''}
      <Box display="flex" flexDirection="column" width="100%" marginTop="5px">
        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
          <Box display="flex" alignItems="center">
            <${StatusDot} color=${job.state === 'ENABLED' ? 'green' : 'yellow'} title=${job.state} marginTop="10px" />
            <P><B>${job.schedule}</B> ${job.timeZone} ${job.lastAttemptTime ? `(Last run: ${ms(Date.now() - new Date(job.lastAttemptTime).getTime())} ago)`: ''}</P>
          </Box>
          <Box display="flex" alignItems="center">
            ${job.state === 'ENABLED' ? html`<Button action="${encodeURIComponent(`scheduler-pause-${job.name}`)}" small secondary>Pause</Button>` : html`<Button action=${encodeURIComponent(`scheduler-resume-${job.name}`)} small secondary>Resume</Button>`}
            <Box width="10px" />
            <Button action="${encodeURIComponent(`scheduler-delete-${job.name}`)}" small warning>Delete</Button>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" width="100%" marginTop="5px">
          <Box display="flex" alignItems="center">
            <B>${(job.httpTarget as any).httpMethod} </B>
            <Link href=${(job.httpTarget as any).uri} target="blank">
              ${(job.httpTarget as any).uri}
            </Link>
          </Box>
          ${job.httpTarget && job.httpTarget.body ? html`
            <BR />
            <Box display="flex" flexDirection="column">
              <B>Request Body:</B>
              <Code value="${encodeURIComponent(fromB64(job.httpTarget.body))}" />
            </Box>
          ` : ''}
        </Box>
      </Box>
    </Box>
  `
}

const methods = ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'HEAD', 'OPTIONS']

const SchedulerFieldset = ({ jobs, error, deployments, disabled }: SchedulerFieldsetProps) => html`
  <Fieldset>
    <FsContent>
      <H2>Cloud Scheduler</H2>
      <P>Run your Now deployments as cron jobs</P>
      ${!jobs && !error && !disabled ? html`
        <${Note} >
          It appears <Link href="https://console.cloud.google.com/apis/library/cloudscheduler.googleapis.com" target="_blank">Cloud Scheduler API</Link> is disabled in your project or your service account doesn’t have access to it.
          Enable the API in Google Cloud Console and add it to your service account to use Cloud Scheduler.
        </${Note}>
      ` : ''}
      ${error ? html`
        <${Note} type="error">
          ${error}
        </${Note}>
      ` : ''}
      ${jobs && jobs.length > 0 ? jobs.map(job => html`<${Job} job=${job} />`) : disabled ? html`<P>No project selected</P>` : html`<P>There are no Cloud Scheduler jobs in this Google Cloud project</P>`}
      ${disabled ? '' : html`
        <Box flexDirection="column" borderTop="1px solid #eaeaea" paddingTop="10px">
          <H2>Create Job</H2>
          <Box display="flex" alignItems="center" marginTop="15px" marginBottom="10px">
            <Input name="job-name" placeholder="my-job" width="160px" />
            <Box width="10px" />
            <Input name="job-description" placeholder="Description (Optional)" width="160px" />
            <Box width="10px" />
            <Select name="job-timezone" width="120px" value="Europe/Dublin">
              ${timezones.map(tz => html`
                <Option caption=${tz.name} value=${tz.value} />
              `)}
            </Select>
            <Box width="10px" />
            <Select name="job-method" width="80px" value="GET">
              ${methods.map(method => html`
                <Option caption=${method} value=${method} />
              `)}
            </Select>
          </Box>
          <Box display="flex" alignItems="center" marginTop="15px" marginBottom="10px">
            <Select name="job-deployment" width="330px" value=${deployments[0].url}>
              ${deployments.map((deployment: any) => html`
                <Option caption=${deployment.url} value=${deployment.url} />
              `)}
            </Select>
            <Box width="10px" />
            <Input name="job-schedule" placeholder="* * * * *" width="160px" />
            <Box width="10px" />
            <Link href="https://crontab.guru" target="_blank">Cron syntax help</Link>
          </Box>
          <Textarea
            width="500px"
            name="job-body"
            placeholder=${`{
  ...
}`}
          />
          <BR />
          <BR />
          <Button highlight action="scheduler-create-job" small>Create New Job</Button>
        </Box>
      `}
    </FsContent>
  </Fieldset>
`

export default SchedulerFieldset
