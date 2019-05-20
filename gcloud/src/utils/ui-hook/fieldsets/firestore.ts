import { htm as html } from '@zeit/integration-utils'
import { Note, StatusDot } from '../components';

const FirestoreFieldset = ({ disabled, apiDisabled, hasCredentials }: any) => html`
  <Fieldset>
    <FsContent>
      <H2>Cloud Firestore</H2>
      <P>Add Cloud Firestore to your projects</P>
      ${disabled ? html`<P>No project selected</P>` : html`
        ${apiDisabled ? html`
          <${Note} >
            It appears that either <Link href="https://console.cloud.google.com/apis/library/firestore.googleapis.com" target="_blank">Firestore API</Link> is disabled in your project, your service account doesn’t have access to it or your project is using Datastore mode.
            Enable Firestore and the Firestore API in Google Cloud Console and add it to your service account to use Firestore.
          </${Note}>
        ` : html`
          <Box display="flex" alignItems="center" marginTop="10px">
            <${StatusDot} color=${apiDisabled ? 'red' : 'green'} />
            <B>${apiDisabled ? 'Disabled' : 'Enabled'}</B>
          </Box>
          <P>Google Cloud Firestore is enabled for this project.</P>
        `}
      `}
    </FsContent>
    <FsFooter>
      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
        <P>Use <B>'GCLOUD_CREDENTIALS'</B> environment variable to access Firestore</P>
        ${hasCredentials ? html`<Button small action="remove-env-var" disabled=${disabled}>Remove env var</Button>` : html`<Button small action="add-env-var" disabled=${Boolean(disabled || apiDisabled)}>Add to project</Button>`}
      </Box>
    </FsFooter>
  </Fieldset>
`

export default FirestoreFieldset
