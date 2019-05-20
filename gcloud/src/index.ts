import { withUiHook, HandlerOptions, htm as html } from '@zeit/integration-utils'
import * as FS from './utils/ui-hook/fieldsets'
import ZEIT from './utils/zeit-api'
import Google from './utils/google-api'
import { isValidServiceAccount } from './utils/google-service-account'
import getSchedulerData from './utils/ui-hook/scheduler-data';
import Empty from './utils/ui-hook/components/empty';
import LoginScreen from './utils/ui-hook/components/login';

// Static assets
const BASE_URL = process.env.NODE_ENV === 'production' ? 'https://gcloud-integration.zeit.sh' : 'http://localhost:5005'
const GCLOUD_LOGO = `${BASE_URL}/static/gcloud.svg`
const GCLOUD_AI_LOGO = `${BASE_URL}/static/gcloud-ai.svg`
const FIREBASE_LOGO = `${BASE_URL}/static/firebase.svg`

export default withUiHook(async (handlerOptions: HandlerOptions): Promise<string> => {
  const zeit = new ZEIT(handlerOptions)

  // Before we begin, let's check if the user is disconnecting and clear the data if so
  if (zeit.action === 'disconnect') {
    await Promise.all([
      zeit.removeCredentialsFromProject(),
      zeit.clearSecrets(),
    ])
  }

  const config = await zeit.config()
  const projectSettings = zeit.projectId ? (config[zeit.projectId] || {}) : {}
  let { googleCredentials } = projectSettings

  // Legacy account, we need to clear it

  // If we're not connected to a Google account
  if (!googleCredentials) {
    if (zeit.action && zeit.action.includes('authenticate-account') && zeit.projectId) {
      const [, keyId] = zeit.action.split('authenticate-account-')

      Object.keys(config).forEach((key: string) => {
        const project: ConfigItem = config[key]
        
        if (project.googleCredentials && project.googleCredentials.private_key_id === keyId) {
          googleCredentials = project.googleCredentials
        }
      })

      // Save credentials in current project
      projectSettings.googleCredentials = googleCredentials

      await zeit.saveConfig({
        ...config,
        [zeit.projectId]: projectSettings
      })
    } else if (zeit.action === 'authenticate' && zeit.projectId) {
      const serviceAcount = zeit.get('service-account')

      try {
        googleCredentials = JSON.parse(serviceAcount)

        if (isValidServiceAccount(googleCredentials)) {
          projectSettings.googleCredentials = googleCredentials

          await zeit.saveConfig({
            ...config,
            [zeit.projectId]: projectSettings
          })
          // Continue
        } else {
          return html`<${LoginScreen} inputValue=${googleCredentials} error="The JSON you provided doesn’t look like a valid service account key" projectId=${zeit.projectId} config=${config} />`
        }
      } catch (e) {
        return html`<${LoginScreen} error=${e} projectId=${zeit.projectId} inputValue=${googleCredentials} config=${config} />`
      }
    } else {
      return html`<${LoginScreen} projectId=${zeit.projectId} config=${config} />`
    }
  }

  // We shouldn't be here in a real-world usage, but in case someone is being shady
  if (!zeit.projectId) {
    return html`
      <${Empty} />
    `
  }

  // @ts-ignore
  const google = new Google({ googleCredentials })

  let gcpProjects

  try {
    gcpProjects = await google.projects()

    if (!gcpProjects) {
      throw new Error('no_projects')
    }
  } catch (e) {
    // If we're here, it means user's Cloud Resource Manager API is disabled and we can't proceed until they enable the API
    // We don't want to remember failed credentials in case they're wrong

    await zeit.saveConfig({ googleCredentials: null })

    return html`<${LoginScreen} projectId=${zeit.projectId} error=${e.message === 'no_projects' ? "This service account doesn't appear to have access to any projects" : html`Couldn’t retrieve any projects. Make sure <Link href="https://console.cloud.google.com/apis/library/cloudresourcemanager.googleapis.com" target="_blank">Resource Manager API</Link> is enabled in your project`} />`
  }

  const selectedProject = zeit.get('gcp-project')
  let { linkedProject } = projectSettings

  // Save GCP project if switched
  if (selectedProject !== linkedProject) {
    linkedProject = selectedProject
    projectSettings.linkedProject = linkedProject

    await zeit.saveConfig({ ...config, [zeit.projectId]: projectSettings })
  }

  const currentProject = linkedProject || gcpProjects[0].name

  if (zeit.action === 'add-env-var') {
    await zeit.ensureCredentials(currentProject, projectSettings.googleCredentials)
    await zeit.addCredentialsToProject()
  }
  if (zeit.action === 'remove-env-var') {
    await zeit.removeCredentialsFromProject()
  }

  // This is used to determine whether to show ADD or REMOVE env var buttons
  const hasCredentials = await zeit.checkCredentials()

  // ===== Scheduler =====
  let schedulerError

  // Scheduler job actions
  if (zeit.action) {
    const action = decodeURIComponent(zeit.action)

    if (zeit.action === 'scheduler-create-job') {
      try {
        await google.createSchedulerJob({
          url: zeit.get('job-deployment'),
          name: zeit.get('job-name'),
          description: zeit.get('job-description'),
          schedule: zeit.get('job-schedule'),
          method: zeit.get('job-method'),
          timezone: zeit.get('job-timezone'),
          body: zeit.get('job-body'),
        }, currentProject)
      } catch (e) {
        schedulerError = e
      }
    }

    if (action.includes('scheduler-pause')) {
      const operation = await google.pauseSchedulerJob(action.split('scheduler-pause-')[1])
      schedulerError = operation ? operation.error : null
    }

    if (action.includes('scheduler-resume')) {
      const operation = await google.resumeSchedulerJob(action.split('scheduler-resume-')[1])
      schedulerError = operation ? operation.error : null
    }

    if (action.includes('scheduler-delete')) {
      const operation = await google.deleteSchedulerJob(action.split('scheduler-delete-')[1])
      schedulerError = operation ? operation.error : null
    }
  }

  // ===== Storage, AI and Firestore =====
  const [
    scheduler,
    storage,
    firestore,
    { disabled: translationDisabled },
    { disabled: visionDisabled },
    { disabled: videoIntelligenceDisabled },
  ] = await Promise.all([
    getSchedulerData(zeit, google, currentProject),
    google.storage(currentProject),
    google.firestore(currentProject),
    google.translation(),
    google.vision(),
    google.videoIntelligence(),
  ])

  let sqlError
  let sqlCredentials = projectSettings.sqlCredentials || {}

  // SQL actions
  if (zeit.action) {
    if (zeit.action === 'create-sql-instance') {
      try {
        await google.createSQLInstance(currentProject, {
          name: zeit.get('sql-instance-name'),
          region: zeit.get('sql-db-region'),
          postgres: zeit.get('sql-db-type') === 'postgres'
        })
      } catch (e) {
        sqlError = e
      }
    }

    if (zeit.action.includes('sql-delete-instance')) {
      try {
        const instanceName = zeit.action.split('sql-delete-instance-')[1]

        await google.deleteSQLInstance(currentProject, instanceName)
        await zeit.removeSQLCredentials(sqlCredentials[instanceName])

        delete sqlCredentials[instanceName]
      } catch (e) {
        sqlError = e
      }
    }

    if (zeit.action.includes('sql-add-to-project')) {
      try {
        const [, instanceName] = zeit.action.split('sql-add-to-project-')
        const credentials = await google.createSQLCredentials(currentProject, instanceName)

        sqlCredentials[instanceName] = await zeit.saveSQLCredentials({ ...credentials, instanceName }) as SQLCredential
        await zeit.saveConfig({ sqlCredentials })
      } catch (e) {
        sqlError = e
      }
    }

    if (zeit.action.includes('sql-remove-from-project')) {
      try {
        const [, instanceName] = zeit.action.split('sql-remove-from-project-')

        await google.removeSQLCredentials(currentProject, instanceName, sqlCredentials[instanceName].username)
        await zeit.removeSQLCredentials(sqlCredentials[instanceName])
        delete sqlCredentials[instanceName]

        await zeit.saveConfig({ sqlCredentials })
      } catch (e) {
        sqlError = e
      }
    }
  }

  const sql = await google.sql(currentProject)

  let firebaseError
  let firebaseAppConfig
  let newAppConfig

  // Firebase actions
  if (zeit.action) {
    const action = decodeURIComponent(zeit.action)

    if (action.includes('firebase-config')) {
      const [, appId] = action.split('firebase-config-')
      const { error, config: appConfig } = await google.firebaseWebAppConfig(appId, currentProject)

      if (error) {
        firebaseError = error
      }

      firebaseAppConfig = appConfig
    }

    if (action.includes('firebase-app-create')) {
      const { error, config: appConfig } = await google.createFirebaseWebApp(zeit.get('firebase-app-name'), currentProject)

      if (error) {
        firebaseError = error
      }

      newAppConfig = appConfig
    }
  }

  const firebaseWebApps = await google.firebaseWebApps(currentProject)

  /* eslint-disable no-irregular-whitespace */ // Need non-breaking space here
  return html`
    <Page>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Img src=${GCLOUD_LOGO} width="240" />
        <Box display="flex" alignItems="center">
          GCP Project:
          <Box width="5px" />
          <Select name="gcp-project" small width="150px" disabled=${!zeit.projectId} value=${currentProject}>
            ${gcpProjects.map((project: any) => html`
              <Option caption=${project.name} value=${project.projectId} />
            `)}
          </Select>
        </Box>
      </Box>
      <$${FS.Scheduler} disabled=${!zeit.projectId} jobs=${scheduler.jobs} error=${schedulerError || scheduler.error} deployments=${scheduler.deployments} />
      <$${FS.Storage} disabled=${!zeit.projectId} buckets=${storage.buckets} error=${storage.error} hasCredentials=${hasCredentials} currentProject=${currentProject} />
      <$${FS.SQL} disabled=${!zeit.projectId} instances=${sql.instances} error=${sqlError || sql.error} apiDisabled=${sql.disabled} credentials=${sqlCredentials} />
      <Box>
        <Img src=${FIREBASE_LOGO} width="170" />
      </Box>
      <$${FS.Firestore} disabled=${!zeit.projectId} apiDisabled=${firestore.disabled} hasCredentials=${hasCredentials} />
      <$${FS.Firebase}
        disabled=${!zeit.projectId}
        apiDisabled=${firebaseWebApps.disabled}
        webapps=${firebaseWebApps.webapps}
        error=${firebaseError || firebaseWebApps.error}
        appConfig=${firebaseAppConfig}
        newConfig=${newAppConfig}
      />
      <Box>
        <Img src=${GCLOUD_AI_LOGO} width="260" />
      </Box>
      <$${FS.AI} disabled=${!zeit.projectId} translationDisabled=${translationDisabled} videoDisabled=${videoIntelligenceDisabled} visionDisabled=${visionDisabled} hasCredentials=${hasCredentials} />
      <Box display="flex" flexDirection="column" borderTop="1px solid #eaeaea" marginTop="20px" paddingTop="20px">
        <H2>Using service account credentials in your apps</H2>
        <P>
          When you add credentials to your project, it will become available inside <B>GCLOUD_CREDENTIALS</B> environment variable as a <B>Base64-encoded JSON string</B>.
          <BR />
          <BR />
          In order to use it, you’ll need to decode Base64 and parse JSON. Then pass it to any Google Cloud SDK client library depending on the language you use to build your app and you are set.
        </P>
      </Box>
      ${zeit.projectId ? html`
        <Box display="flex" flexDirection="column" borderTop="1px solid #eaeaea" marginTop="20px" paddingTop="20px">
          <H2>Disconnect</H2>
          <P>
            You can disconnect your service account from the integration by clicking the button below.
            <BR />
            <BR />
            Keep in mind, <B>this will only delete your credentials and data from ZEIT</B>.
            <BR />
            <BR />
            Any remaining resources you have created via the integration <B>will remain active</B> and count towards your Google Cloud billing, unless deleted in the console.
          </P>
          <BR />
          <Button shadow secondary action="disconnect">Disconnect</Button>
        </Box>
      ` : ``}
    </Page>
  `
})