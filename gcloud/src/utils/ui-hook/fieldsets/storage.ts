import { htm as html } from '@zeit/integration-utils'
import { Note } from '../components';

const createBucketLink = (projectId: string) => `https://console.cloud.google.com/storage/create-bucket?project=${projectId}`

const StorageFieldset = ({ buckets = [], error, disabled, hasCredentials, currentProject }: any) => html`
  <Fieldset>
    <FsContent>
      ${error ? html`
        <${Note} type="error">
          ${error}
        </${Note}>
      ` : ''}
      <H2>Cloud Storage</H2>
      <P>Link Google Cloud Storage buckets to your deployments</P>
      ${buckets && buckets.length > 0 ? html`
        <BR />
        <Box display="flex" flexDirection="column">
          ${buckets.map((bucket: any) => html`
            <Box>• <B>${bucket.name}</B> ${`(${bucket.location})`}</Box>
          `)}
        <BR />
        </Box>
      ` : disabled ? html`<P>No project selected</P>` : html`<P>No buckets found in this project</P>`}
      <Link href=${createBucketLink(currentProject)} target="_blank">Create storage bucket →</Link>
    </FsContent>
    <FsFooter>
      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
        <P>Use <B>'GCLOUD_CREDENTIALS'</B> environment variable to access Cloud Storage</P>
        ${hasCredentials ? html`<Button small action="remove-env-var" disabled=${disabled}>Remove env var</Button>` : html`<Button small action="add-env-var" disabled=${disabled}>Add to project</Button>`}
      </Box>
    </FsFooter>
  </Fieldset>
`

export default StorageFieldset
