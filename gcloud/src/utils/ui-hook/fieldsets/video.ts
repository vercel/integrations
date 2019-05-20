import { htm as html } from '@zeit/integration-utils'
import { StatusDot } from '../components'

const VideoFieldset = ({ disabled, apiDisabled, hasCredentials }: any) => html`
  <Fieldset>
    <FsContent>
    <H2>Video Intelligence API</H2>
      <P>Integrate Video Intelligence API with your projects</P>
      ${disabled ? html`<P>No project selected</P>` : html`
        <Box display="flex" alignItems="center" height="14px" marginTop="10px">
          <${StatusDot} color=${apiDisabled ? 'red' : 'green'} />
          <B>${apiDisabled ? 'Disabled' : 'Enabled'}</B>
        </Box>
        ${apiDisabled
    ? html`<P>Video Intelligence API is disabled for this Google Cloud project. <Link href="https://console.developers.google.com/apis/api/videointelligence.googleapis.com/overview" target="_blank">Enable the API</Link> in your project to use it with your Now deployments.</P>`
    : html`<P>This API is enabled for this Google Cloud project.</P>`}
      `}
    </FsContent>
    <FsFooter>
      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
        <P>Use <B>'GCLOUD_CREDENTIALS'</B> environment variable to access Video Intelligence API</P>
        ${hasCredentials ? html`<Button small action="remove-env-var" disabled=${disabled}>Remove env var</Button>` : html`<Button small action="add-env-var" disabled=${Boolean(disabled || apiDisabled)}>Add to project</Button>`}
      </Box>
    </FsFooter>
  </Fieldset>
`

export default VideoFieldset
