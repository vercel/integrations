import { htm as html } from '@zeit/integration-utils'
import { Note } from '../components';

interface WebApp {
  name: string;
  appId: string;
  displayName: string;
  projectId: string;
}

const createWebSnippet = (appConfig: any) => {
  return encodeURIComponent(`<!-- The core Firebase JS SDK is always required and must be listed first -->
<script src="https://www.gstatic.com/firebasejs/6.0.2/firebase-app.js"></script>

<!-- TODO: Add SDKs for Firebase products that you want to use
      https://firebase.google.com/docs/web/setup#config-web-app -->

<script>
  // Your web app's Firebase configuration
  var firebaseConfig = ${JSON.stringify(appConfig, null, 4)};
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
</script>`)
}

const FirebaseFieldset = ({ disabled, apiDisabled, error, webapps = [], appConfig, newConfig }: any) => html`
  <Fieldset>
    <FsContent>
      <H2>Firebase Web Apps</H2>
      <P>Create Firebase Web App credentials for your projects</P>
      ${error ? html`
        <${Note} type="error">
          ${error}
        </${Note}>
      ` : ''}
      ${apiDisabled ? html`
        <${Note} >
          It appears <Link href="https://console.cloud.google.com/apis/library/firebase.googleapis.com" target="_blank">Firebase Management API</Link> is disabled in your project or your service account doesn’t have access to it.
          Enable Firebase Management API in Google Cloud Console and add it to your service account to use Firebase Web Apps.
        </${Note}>
      ` : ''}
      ${disabled ? html`<P>No project selected</P>` : html`
        ${!webapps || webapps.length === 0 ? html`
          <P>There are no Web Apps in this project</P>
        ` : html`
          <BR />
          ${webapps.map((app: WebApp) => html`
            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" marginBottom="10px">
              <B>${app.displayName}</B>
              <Box display="flex" alignItems="center">
                <Button small secondary action=${encodeURIComponent(`firebase-config-${app.appId}`)}>Get Config</Button>
              </Box>
            </Box>
          `)}
        `}
        ${appConfig ? html`
          <Box display="flex" marginTop="20px" width="100%" overflowX="scroll">
            <Code value=${createWebSnippet(appConfig)} />
          </Box>
        ` : ''}
        <Box display="flex" flexDirection="column" borderTop="1px solid #eaeaea" marginTop="20px" paddingTop="20px">
          <H2>Create Web App</H2>
          <P>Add Firebase to your web application</P>
          <Box display="flex" flexDirection="column">
            <Input width="250px" name="firebase-app-name" placeholder="My Next.js App" />
            <Button action="firebase-app-create" small>Create Web App</Button>
          </Box>
          ${newConfig ? html`
          <Box display="flex" marginTop="20px" width="100%" overflowX="scroll">
            <Code value=${createWebSnippet(newConfig)} />
          </Box>
        ` : ''}
        </Box>
      `}
    </FsContent>
  </Fieldset>
`

export default FirebaseFieldset
