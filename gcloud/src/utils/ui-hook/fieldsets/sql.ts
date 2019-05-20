import { htm as html } from '@zeit/integration-utils'
import { StatusDot, Note } from '../components';

const regions = {
  northAmerica: [
    { value: 'northamerica-northeast1', name: 'Montréal' },
    { value: 'us-central1', name: 'Iowa' },
    { value: 'us-east1', name: 'South Carolina' },
    { value: 'us-east4', name: 'Northern Virginia' },
    { value: 'us-west1', name: 'Oregon' },
    { value: 'us-west2', name: 'Los Angeles' },
  ],
  southAmerica: [
    { value: 'southamerica-east1', name: 'São Paulo' },
  ],
  europe: [
    { value: 'europe-north1', name: 'Finland' },
    { value: 'europe-west1', name: 'Belgium' },
    { value: 'europe-west2', name: 'London' },
    { value: 'europe-west3', name: 'Frankfurt' },
    { value: 'europe-west4', name: 'Netherlands' },
    { value: 'europe-west6', name: 'Zürich' },
  ],
  asia: [
    { value: 'asia-east1', name: 'Taiwan' },
    { value: 'asia-east2', name: 'Hong' },
    { value: 'asia-northeast1', name: 'Tokyo' },
    { value: 'asia-northeast2', name: 'Osaka' },
    { value: 'asia-south1', name: 'Mumbai' },
    { value: 'asia-southeast1', name: 'Singapore' },
  ],
  oceania: [
    { value: 'australia-southeast1', name: 'Sydney' },
  ]
}

const getStatusColor = ({ state }: { state: string }) => {
  switch (state) {
    case 'FAIED':
    case 'SUSPENDED':
      return 'red'
    case 'PENDING_CREATE':
    case 'MAINTENANCE':
      return 'yellow'
    case 'RUNNABLE':
      return 'green'
    default:
      return 'gray'
  }
}

const getDbVersion = ({ databaseVersion }: { databaseVersion: string }) => {
  switch (databaseVersion) {
    case 'MYSQL_5_7':
      return '(MySQL 5.7)'
    case 'MYSQL_5_6':
      return '(MySQL 5.6)'
    case 'POSTGRES_9_6':
      return '(PostgreSQL 9.6)'
  }
}

const getRegion = (region: string) => {
  let regionName: string | null = null

  Object.keys(regions).forEach((continent: string) => {
    if (!regionName) {
      // @ts-ignore
      const found = regions[continent].find((r: any) => r.value === region)
      
      if (found) {
        regionName = found.name
      }
    }
  })

  return regionName
}

const Instance = ({ instance, credentials }: any) => html`
  <Box display="flex" flexDirection="column" border="1px solid #eaeaea" borderRadius="5px" padding="10px" marginBottom="20px">
    <P><B>${instance.name}</B> ${getDbVersion(instance)}</P>
    ${instance.description ? html`<P>${instance.description}</P>` : ''}
    <Box display="flex" flexDirection="column" width="100%" marginTop="5px">
      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
        <Box display="flex" alignItems="center">
          <${StatusDot} color=${getStatusColor(instance)} title=${instance.state} marginTop="10px" />
          <P><B>${instance.ipAddresses && instance.ipAddresses.length > 0 ? `${instance.ipAddresses[0].ipAddress}  ` : ''}</B> ${instance.state === 'PENDING_CREATE' ? 'Preparing...' : getRegion(instance.region)}</P>
        </Box>
        <Box display="flex" alignItems="center">
          ${instance.state === 'RUNNABLE' ? html`
            ${credentials
    ? html`<Button action="${encodeURIComponent(`sql-remove-from-project-${instance.name}`)}" small secondary>Remove credentials</Button>`
    : html`<Button action="${encodeURIComponent(`sql-add-to-project-${instance.name}`)}" small secondary>Add to project</Button>`}
            <Box width="10px" />
            <Button action="${encodeURIComponent(`sql-delete-instance-${instance.name}`)}" small warning>Delete Instance</Button>
          ` : ''}
        </Box>
      </Box>
      ${credentials ? html`
      <Box borderTop="1px solid #eaeaea" marginTop="10px" paddingTop="10px">
        <P>Credentials for this instance:<BR /><BR />${credentials.ipVar}<BR />${credentials.usernameVar}<BR />${credentials.passwordVar}</P>
      </Box>` : ''}
    </Box>
  </Box>
`

const SQLFieldset = ({ instances, disabled, apiDisabled, error, credentials }: any) => html`
  <Fieldset>
    <FsContent>
      <H2>Cloud SQL</H2>
      <P>Create MySQL and PostgreSQL instances for your Now projects</P>
      ${error ? html`
        <${Note} type="error">
          ${error}
        </${Note}>
      ` : ''}
      ${apiDisabled ? html`
        <${Note} >
          It appears <Link href="https://console.cloud.google.com/apis/library/sqladmin.googleapis.com" target="_blank">Cloud SQL Admin API</Link> is disabled in your project or your service account doesn’t have access to it.
          Enable the API in Google Cloud Console and add it to your service account to use Cloud SQL.
        </${Note}>
      ` : html`
        ${instances && instances.length > 0 ? instances.map((instance: any) => html`<${Instance} instance=${instance} credentials=${credentials[instance.name]} />`) : disabled ? html`<P>No project selected</P>`: html`<P>There are no instances in this project</P>`}
        ${!disabled && !apiDisabled ? html`<Box display="flex" flexDirection="column" borderTop="1px solid #eaeaea" paddingTop="10px">
          <H2>Create SQL Instance</H2>
          <Box display="flex" flexDirection="row" marginBottom="10px">
            <Input name="sql-instance-name" placeholder="my-db-instance" width="200px" />
            <Box width="10px" />
            <Select name="sql-db-region" width="240px" value="GET" value="us-west1">
              ${regions.northAmerica.map(region => html`
                <Option caption=${`${region.name} (North America)`} value=${region.value} />
              `)}
              ${regions.southAmerica.map(region => html`
                <Option caption=${`${region.name} (South America)`} value=${region.value} />
              `)}
              ${regions.europe.map(region => html`
                <Option caption=${`${region.name} (Europe)`} value=${region.value} />
              `)}
              ${regions.asia.map(region => html`
                <Option caption=${`${region.name} (Asia)`} value=${region.value} />
              `)}
              ${regions.oceania.map(region => html`
                <Option caption=${`${region.name} (Australia)`} value=${region.value} />
              `)}
            </Select>
            <Box width="10px" />
            <Select name="sql-db-type" width="200px" value="GET">
              <Option caption="MySQL" value="mysql" />
              <Option caption="PostgreSQL" value="postgres" />
            </Select>
          </Box>
          <Button small highlight action="create-sql-instance">Create SQL Instance</Button>
        </Box>` : ''}
      `}
    </FsContent>
  </Fieldset>
`

export default SQLFieldset
