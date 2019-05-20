import { htm as html } from '@zeit/integration-utils'
import { Table, HeaderItem, BodyItem, TableRow } from '../components/Table'
import { timezones } from '../utils/timezones'
import { Status } from '../components/Status'
import { Field } from '../components/Field'
import { zonedTimeToUtc } from 'date-fns-tz'
import ms from 'ms'

const methods = ["GET", "POST", "HEAD", "PUT", "PATCH", "DELETE", "CONNECT", "OPTIONS", "TRACE"]

const Badge = ({ successes, children }: { successes: boolean, children: any }) => html`
	<Box display="inline-block" color="white" borderRadius="7px" padding="0px 4px" backgroundColor=${successes ? 'rgb(80, 227, 194)' : '#ED4C5C'} fontWeight="bold">${children}</Box>
`

const Log = ({ log, timezone }: {log: any, timezone: string }) => {
	const data = new Date().getTime()
	const ago = new Date(zonedTimeToUtc(log.fire_time, timezone)).getTime()

	return html`
	<${TableRow}>
		<${BodyItem}><${Badge} successes=${log.http_code === 200}>${log.http_code}</${Badge}></${BodyItem}>
		<${BodyItem}>${log.error}</${BodyItem}>
		<${BodyItem}>${ms(data - ago)}</${BodyItem}>
	</${TableRow}>
`
}

export const UpsertJob = ({ id, logs, timezone, clientState, deployments, error, }: { id: number | undefined, logs: any[] | undefined, timezone: string | undefined, clientState: any, deployments: any[], error: any }) => {
  return html`
    <Page>
			${error ? html`<Notice>${error.message}</Notice>` : ''}
			<Container>
				<Box width="100%" display="flex" justifyContent="space-between">
    	  	<H1>${id ? 'Cron job detail' : 'Create a new cron job'}</H1>
					<Button small secondary action="back">Back</Button>
				</Box>
				<${Field} title="Cron name">
					<Input name="cron_job_name" placholder="Cron name" value="${clientState.cron_job_name || ''}"/>
				</${Field}>
				<${Field} title="Cron url" footer=${html`<P>Cron job execution <B>method</B> and <B>url</B> where is cron periodically executed.</P>`}>
					<Box display="flex" alignItems="center">
						<Box marginRight="10px">
							<Select name="http_method" value=${clientState.http_method || 'GET'}>
								${methods.map(method => html`<Option caption=${method} value=${method} />`)}
							</Select>
						</Box>
						${deployments.length > 0 ? 
								html`
									<Select name="url" value=${clientState.url || deployments[0].url}>
										${deployments.map(deployment => html`<Option caption=${`https://${deployment.url}`} value=${`https://${deployment.url}`} />`)}
									</Select>` : html`
									<P>Please deploy something to your project or select different one!</P>
								`}
						<Box padding="0 10px" fontSize="20px">/</Box>
    	      <Input name="path" placeholder="Cron path" value="${clientState.path || ''}"/>
					</Box>
				</${Field}>
				<${Field} title="Post data" footer=${html`<P>Post data works just for <B>POST,</B> <B>PUT,</B> <B>PATCH.</B></P>`}>
					<Input width="100%" name="posts" placeholder="param1=val1&param2=val2" value="${clientState.posts || ''}"/>
				</${Field}>
				<${Field} title="Cron job execution time" footer=${html`<P>You can select in what <B>timezone</B> cron job is going to be executed and <Link target="_blank" href="https://www.easycron.com/faq/What-cron-expression-does-easycron-support"><B>cron expression.</B></Link></P>`}>
					<Box display="flex" alignItems="center">
						<Box marginRight="10px">
							<Select name="timezone" value=${clientState.timezone || "Europe/London"}>
								${timezones.map(timezone => html`<Option caption=${timezone.name} value=${timezone.value} />`)}
							</Select>
						</Box>
						<Input name="cron_expression" placeholder="* * * * *" value="${clientState.cron_expression || ''}"/>					
					</Box>
				</${Field}>
				<Box width="100%" display="flex" justifyContent="space-between" flexDirection="row-reverse">
    	    ${id ? html`<Button action=${`updateJob-${id}`}>Update job</Button>` : html`<Button action="createCronJob">Create job</Button>`}
					${id ? html`<Button warning action=${`deleteJob-${id}`}>Delete job</Button>`  :  ''}
    	  </Box>
				<BR/>
				<BR/>
				${id ? html`<Container>
				<${Field} title="Cron job details" footer=${html`
					<Box width="100%" display="flex" justifyContent="space-between" alignItems="center">
						<Box isplay="flex" justifyContent="spaceBetween" alignItems="center" width="140px" marginRight="50px">
							Cron job is running: <${Status} active=${Boolean(Number(clientState.status))} />
						</Box>
						${clientState.status === '0' ? html`<Button small action=${`jobEnable-${id}`}>Enable</Button>` : html`<Button small warning action=${`jobDisable-${id}`}>Disable</Button>`}
					</Box>`}
				>
					<Box display="flex" alignItems="center" padding="10px 0">Total successful requests:<Box paddingLeft="5px"><${Badge} successes=${true}>${clientState.total_successes}</${Badge}></Box></Box>
					<Box display="flex" alignItems="center" padding="10px 0">Total unsuccessful requests:<Box paddingLeft="5px"><${Badge} successes=${false}>${clientState.total_failures}</${Badge}></Box></Box>
				</${Field}>
				<BR/>
				<BR/>
				<${Table} header=${html`
							<${HeaderItem}>Http code</${HeaderItem}>
							<${HeaderItem}>Error response</${HeaderItem}>
							<${HeaderItem}>Ago</${HeaderItem}>
						`}  
					>
					${logs && logs.reverse().map(
    	      log =>
    	        html`
    	          <${Log} log=${log} timezone=${timezone} />
    	        `,
    	    	)}
					</${Table}>
				</Container>` : ''}				
			</Container>
  	</Page>
  `
}

