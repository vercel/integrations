import { htm as html } from '@zeit/integration-utils'
import { VerticalBox, Divider, Note } from './'

const BASE_URL = process.env.NODE_ENV === 'production' ? 'https://gcloud-integration.zeit.sh' : 'http://localhost:5005'
const INTEGRATION_LOGO = `${BASE_URL}/static/integration.svg`
const STEP_ONE = `${BASE_URL}/static/step-1.png`
const STEP_TWO = `${BASE_URL}/static/step-2.png`

const formatAccount = (email: string) => {
  try {
    const [name, address] = email.split('@')
    const [project] = address.split('.iam.gserviceaccount.com')

    return html`<B>${name}</B> in project <B>${project}</B>`
  } catch (e) {
    return email
  }
}

const LoginScreen = ({ error, projectId, inputValue, config }: any) => html`
  <Page>
    ${!projectId ? html`
    <Box display="flex" alignItems="center" justifyContent="flex-end">
      ZEIT Project:
      <Box width="5px" />
      <ProjectSwitcher />
    </Box>
    <Notice type="message">
      <B>NOTE:</B> In order to link Google Cloud resources to your deployments, select a project from the picker above
    </Notice>
    <BR />
    ` : ''}
    <${VerticalBox}>
      <Img src=${INTEGRATION_LOGO} width="140" draggable=${false} />
      <BR />
      <P>
        Google Cloud integration connects your ZEIT projects with Google Cloud Platform projects.
        <BR />
        <BR />
        To connect your GCP project to a ZEIT project, <Link target="_blank" href="https://console.cloud.google.com/apis/credentials/serviceaccountkey">create a service account key</Link> on Google Cloud Platform and paste the key JSON below:
        <BR />
        <BR />
        <Textarea
          width="320px"
          name="service-account"
          disabled=${!projectId}
          value=${inputValue || ''}
          placeholder=${`{
  ”type”: ”service_account”,
  ...
}`}
        />
      </P>
      <BR />
      <Button shadow highlight disabled=${!projectId} action="authenticate">Connect</Button>
      <Box width="100%" textAlign="center" marginTop="20px">
        <P>We will add this service account as credentials to your deployments</P>
      </Box>
      ${error ? html`<${Note} color="red">${error}</Note>` : ''}
    </${VerticalBox}>
    <BR />
    
    ${config && Object.keys(config).length > 0 ? html`
      <Box borderTop="1px solid #eaeaea" marginTop="10px" paddingTop="10px" display="flex" flexDirection="column">
        <H2>Known credentials</H2>
        ${Object.keys(config).reduce((acc: any[], key: string): any[] => {
    /* eslint-disable @typescript-eslint/indent */
					if (!config[key]) {
						return acc;
					}

          let exists = acc.find(
              credential => config[key].googleCredentials &&
              credential.private_key_id === config[key].googleCredentials.private_key_id
            )

          if (!exists && config[key].googleCredentials) {
            return [
              ...acc,
              config[key].googleCredentials
            ]
          }

          return acc
        }, []).map((credentials: any) => html`
            <Box display="flex" alignItems="center" justifyContent="space-between" marginBottom="10px">
              <P>${formatAccount(credentials.client_email)}</P>
              <Button secondary small action=${encodeURIComponent(`authenticate-account-${credentials.private_key_id}`)}>Use service account</Button>
            </Box>
          `
        )}
      </Box>
    ` : ''}
    
    <${Divider} text="SERVICE ACCOUNT HOW TO" />
    <BR />
    <P>
      <B>1.</B> Go to <Link target="blank" href="https://console.cloud.google.com/apis/credentials/serviceaccountkey">APIs & Services > Credentials</Link> in your Google Cloud Console and select the project you want to connect.
      <BR />
      <BR />
      <Img src=${STEP_ONE} width="100%" />
      <BR />
      <BR />
      <B>2.</B> Click <B>”New service account”</B>, enter the name for it and set <B>”Role”</B> to <B>”Project > Owner”</B>.
      <BR />
      <BR />
      <Img src=${STEP_TWO} width="100%" />
      <BR />
      <BR />
      <${Note} color="black">
        <B>NOTE:</B> You may specify granular permissions instead of ”Project Owner”, but if your service account doesn’t have access to a certain API, you won’t be able to use it in the integration.
      </Note>
      <B>3.</B> Make sure <B>”Key type”</B> is set to <B>”JSON”</B> and click <B>”Create”</B>. Once done, paste the contents of the downloaded JSON file into the field above and click <B>”Connect”</B>.
    </P>
  </Page>
`

export default LoginScreen
