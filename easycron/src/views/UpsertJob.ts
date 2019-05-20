import { htm as html } from '@zeit/integration-utils'
import { Table, HeaderItem, BodyItem } from '../components/Table'
import ms from 'ms'
import { timezones } from '../utils/timezones';
import { Status } from '../components/Status';

const methods = ["GET", "POST", "HEAD", "PUT", "PATCH", "DELETE", "CONNECT", "OPTIONS", "TRACE"]

const Badge = ({ successes, children }: { successes: boolean, children: any }) => html`
	<Box display="inline-block" color="white" borderRadius="7px" padding="0px 4px" backgroundColor=${successes ? 'rgb(80, 227, 194)' : 'red'}><P>${children}</P></Box>
`

const Log = ({ log }: {log: any}) => {

	const data = new Date(log.fire_time)
	const ago = new Date().getTime() - data.getTime()

	return html`
	<Box display="table-row">
		<${BodyItem}><${Badge} successes=${log.http_code === 200}>${log.http_code}</${Badge}></${BodyItem}>
		<${BodyItem}>${log.error}</${BodyItem}>
		<${BodyItem}>${ms(ago)}</${BodyItem}>
	</Box>
`
}


const Row = ({ children }: { children: any}) => {
	return html`<Box width="100%" marginBottom="14px">${children}</Box>`
}

export const UpsertJob = ({ id, logs, clientState, deployments }: { id: number | undefined, logs: any[] | undefined, clientState: any, deployments: any[] }) => {
  return html`
    <Page>
		<Container>
			<Box width="100%" display="flex" justifyContent="space-between">
      	<H1>${id ? 'Cron job detail' : 'Create a new cron job'}</H1>
				<Button small secondary action="back">Back</Button>
			</Box>
      <Fieldset>
				<FsContent>
					<${Row}>
						<FsTitle><B>Cron name</B></FsTitle>
						<Input name="cron_job_name" placholder="Cron name" value="${clientState.cron_job_name || ''}"/>
					</${Row}>
					<${Row}>
						<FsTitle><B>Cron url</B></FsTitle>
						<Box display="flex" alignItems="center">
							<Box marginRight="10px">
								<Select name="http_method" value=${clientState.http_method || 'GET'}>
									${methods.map(method => html`<Option caption=${method} value=${method} />`)}
								</Select>
							</Box>
							${deployments.length > 0 ? 
							html`<Select name="url" value=${clientState.url || deployments[0].url}>
								${deployments.map(deployment => html`<Option caption=${`https://${deployment.url}`} value=${`https://${deployment.url}`} />`)}
							</Select>` : html`<P>Please deploy something to your project or select different one!</P>`}
							<Box padding="0 10px" fontSize="20px">/</Box>
          		<Input name="path" placeholder="Cron path" value="${clientState.path || ''}"/>
						</Box>
					</${Row}>
					<${Row}>
						<FsTitle>Post data</FsTitle>
          	<Input name="posts" placeholder="param1=val1&param2=val2" value="${clientState.posts || ''}"/>
						<FsSubtitle>Post data works just for <B>POST,</B> <B>PUT,</B> <B>PATCH.</B></FsSubtitle>
					</${Row}>
					<${Row}>
					<FsTitle><B>Cron job execution time</B></FsTitle>
					<Box display="flex" alignItems="center">
						<Box marginRight="10px">
							<Select name="timezone" value=${clientState.timezone || "Europe/London"}>
								${timezones.map(timezone => html`<Option caption=${timezone.name} value=${timezone.value} />`)}
							</Select>
						</Box>
						<Input name="cron_expression" placeholder="* * * * *" value="${clientState.cron_expression || ''}"/>					
					</Box>
					<FsSubtitle>You can select in what <B>timezone</B> cron job is going to be executed and <B>cron expression</B> <Link target="_blank" href="https://www.easycron.com/faq/What-cron-expression-does-easycron-support">here.</Link></FsSubtitle>
					</${Row}>
					${id ? html`<Box display="flex" alignItems="center" padding="10px 0" >
						<Box isplay="flex" justifyContent="spaceBetween" alignItems="center" width="140px" marginRight="50px">
							Cron job is running: <${Status} active=${Boolean(Number(clientState.status))} />
						</Box>
						${clientState.status === '0' ? html`<Button small highlight action=${`jobEnable-${id}`}>Enable</Button>` : html`<Button small warning action=${`jobDisable-${id}`}>Disable</Button>`}
					</Box>` : ''}
				</FsContent>
        <FsFooter>
          <Box width="100%" display="flex" justifyContent="space-between" flexDirection="row-reverse">
            ${id ? html`<Button small action=${`updateJob-${id}`}>Update job</Button>` : html`<Button small action="createCronJob">Create job</Button>`}
						${id ? html`<Button small warning action=${`deleteJob-${id}`}>Delete job</Button>`  :  ''}
          </Box>
				</FsFooter>

			</Fieldset>
			</Container>
			${id ? html`
			<Container>
				<H1>Cron job logs</H1>
				<Box padding="10px"><B>Total successesful requests:</B> <${Badge} successes=${true}>${clientState.total_successes}</${Badge}></Box>
				<Box padding="10px"><B>Total unsuccessesful requests:</B> <${Badge} successes=${false}>${clientState.total_failures}</${Badge}></Box>
				<${Table} header=${html`
						<${HeaderItem}>Http code</${HeaderItem}>
						<${HeaderItem}>Error response</${HeaderItem}>
						<${HeaderItem}>Ago</${HeaderItem}>
					`}  
				>
				${logs && logs.reverse().map(
          log =>
            html`
              <${Log} log=${log} />
            `,
        	)}
				</${Table}>
			</Container>` : ''}
    </Page>
  `
}

