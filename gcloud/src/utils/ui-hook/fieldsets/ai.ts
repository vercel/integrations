import { htm as html } from '@zeit/integration-utils'
import { StatusDot } from '../components';

const AIFieldset = ({ disabled, translationDisabled, videoDisabled, visionDisabled, hasCredentials }: any) => html`
  <Fieldset>
    <FsContent>
      <Box display="flex" flexDirection="column" marginBottom="30px" paddingBottom="30px" borderBottom="1px solid #eaeaea">
        <H2>Translation</H2>
        <P>Add Google Translate capabilities to your projects</P>
        ${disabled ? html`<P>No project selected</P>` : html`
          <Box display="flex" alignItems="center" height="14px" marginTop="10px">
            <${StatusDot} color=${translationDisabled ? 'red' : 'green'} />
            <B>${translationDisabled ? 'Disabled' : 'Enabled'}</B>
          </Box>
          ${translationDisabled
    ? html`<P>Translation API is disabled for this Google Cloud project. <Link href="https://console.developers.google.com/apis/api/translate.googleapis.com/overview" target="_blank">Enable the API</Link> in your project to use it with your Now deployments.</P>`
    : html`<P>This API is enabled for this Google Cloud project.</P>`}
        `}
      </Box>
      <Box display="flex" flexDirection="column" marginBottom="30px" paddingBottom="30px" borderBottom="1px solid #eaeaea">
        <H2>Cloud Vision API</H2>
        <P>Integrate Google Cloud Vision API with your projects</P>
        ${disabled ? html`<P>No project selected</P>` : html`
          <Box display="flex" alignItems="center" height="14px" marginTop="10px">
            <${StatusDot} color=${visionDisabled ? 'red' : 'green'} />
            <B>${visionDisabled ? 'Disabled' : 'Enabled'}</B>
          </Box>
          ${visionDisabled
    ? html`<P>Cloud Vision API is disabled for this Google Cloud project. <Link href="https://console.developers.google.com/apis/api/vision.googleapis.com/overview" target="_blank">Enable the API</Link> in your project to use it with your Now deployments.</P>`
    : html`<P>This API is enabled for this Google Cloud project.</P>`}
        `}
      </Box>
      <Box display="flex" flexDirection="column">
        <H2>Video Intelligence API</H2>
        <P>Integrate Video Intelligence API with your projects</P>
        ${disabled ? html`<P>No project selected</P>` : html`
          <Box display="flex" alignItems="center" height="14px" marginTop="10px">
            <${StatusDot} color=${videoDisabled ? 'red' : 'green'} />
            <B>${videoDisabled ? 'Disabled' : 'Enabled'}</B>
          </Box>
          ${videoDisabled
    ? html`<P>Video Intelligence API is disabled for this Google Cloud project. <Link href="https://console.developers.google.com/apis/api/videointelligence.googleapis.com/overview" target="_blank">Enable the API</Link> in your project to use it with your Now deployments.</P>`
    : html`<P>This API is enabled for this Google Cloud project.</P>`}
        `}
      </Box>
    </FsContent>
    <FsFooter>
      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
        <P>Use <B>'GCLOUD_CREDENTIALS'</B> environment variable to access these APIs</P>
        ${hasCredentials ? html`<Button small action="remove-env-var" disabled=${disabled}>Remove env var</Button>` : html`<Button small action="add-env-var" disabled=${Boolean(disabled)}>Add to project</Button>`}
      </Box>
    </FsFooter>
  </Fieldset>
`

export default AIFieldset
