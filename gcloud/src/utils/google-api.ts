/**
 * NOTE: Some of this code implements OAuth authentication with full access to GCP
 * However Google refused to approve the integration because `cloud-platform` OAuth scope is "too broad"
 * They said we should use service accounts instead since there aren't any less broad scopes, so
 * until we can convince Google that we really want OAuth, I'm gonna leave this code here unused
 */

import { google, GoogleApis, cloudresourcemanager_v1, cloudscheduler_v1beta1 } from 'googleapis'
import uid from 'uid-promise';
import { JWT, JWTInput } from 'google-auth-library';
import { GaxiosResponse } from 'gaxios';
import { toB64 } from './auth-tools';

interface GoogleOptions {
  // oauth?: Credentials;
  googleCredentials: JWTInput;
}

interface SchedulerJob {
  url: string;
  schedule: string;
  timezone: string;
  method: string;
  body: string;
  name: string;
  description: string;
}

export class GoogleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GoogleError'
  }
}

const format = (response: GaxiosResponse<any>, field: string): any => {
  if (response && response.data) {
    return response.data[field]
  }

  return null
}

const id = () => {
  let result = ''
  let characters = 'abcdefghijklmnopqrstuvwxyz'
  let charactersLength = characters.length
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

// Base64 pixel is used to ping vision and video APIs for availability
const pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='

// const { CLIENT_ID, CLIENT_SECRET, BASE_URL } = process.env
// const REDIRECT_URL = `${BASE_URL}/connect`

export default class Google {
  constructor(options: GoogleOptions) {
    this.auth = google.auth.fromJSON(options.googleCredentials) as JWT
    this.auth.scopes = 'https://www.googleapis.com/auth/cloud-platform'

    console.log('Created Google client with service account')

    this.client = google
    this.client.options({
      auth: this.auth
    })

    // this.options = options
    // this.zeitToken = zeitToken
    // this.zeitTeamId = zeitTeamId

    // Refresh OAuth credentials
    // this.auth.on('tokens', this.refreshTokens)
  }

  private auth: JWT;
  private client: GoogleApis;
  // private options: GoogleOptions;
  // private zeitToken: string;
  // private zeitTeamId: string | null;

  projects = async (): Promise<cloudresourcemanager_v1.Schema$Project[]> => {
    console.log('Fetching GCP Projects')

    try {
      const res = await this.client.cloudresourcemanager('v1').projects.list()

      return format(res, 'projects')
    } catch (e) {
      throw new GoogleError(e)
    }
  }

  scheduler = async (projectId: string) => {
    console.log('Fetching Cloud Scheduler jobs')

    try {
      const locs = await this.client.cloudscheduler('v1beta1').projects.locations.list({
        name: `projects/${projectId}`
      })
      const locations: cloudscheduler_v1beta1.Schema$Location[] = format(locs, 'locations')
      const jobsByLocation = await Promise.all(locations.map(async ({ name }) => {
        const locationJobs = await this.client.cloudscheduler('v1beta1').projects.locations.jobs.list({
          parent: name,
        })

        return format(locationJobs, 'jobs')
      }))

      const jobs = jobsByLocation.reduce((acc, location) => {
        const loc = location || []
        return [...acc, ...loc].filter(Boolean)
      }, [])

      return { jobs }
    } catch (e) {
      const error = format(e.response, 'error')
      return { error: error ? error.message : null }
    }
  }

  createSchedulerJob = async (jobData: SchedulerJob, projectId: string) => {
    console.log('Creating Cloud Scheduler job')

    const { url, schedule, timezone, method, body, name, description } = jobData
    const locations = await this.client.cloudscheduler('v1beta1').projects.locations.list({
      name: `projects/${projectId}`
    })
    const location: cloudscheduler_v1beta1.Schema$Location = format(locations, 'locations')[0]

    const jobName = name ? `zeit-${name.replace(/\s/g, '-').replace(/\d/g, '').toLowerCase()}` : `zeit-${id()}`

    const job = await this.client.cloudscheduler('v1beta1').projects.locations.jobs.create({
      parent: `projects/${projectId}/locations/${location.locationId}`,
      requestBody: {
        timeZone: timezone,
        httpTarget: {
          uri: `https://${url}`,
          httpMethod: method,
          body: method === 'GET' ? undefined : toB64(body)
        },
        name: `projects/${projectId}/locations/${location.locationId}/jobs/${jobName}`,
        description,
        schedule,
      }
    })

    return format(job, 'job')
  }

  pauseSchedulerJob = async (name: string) => {
    console.log('Pausing Cloud Scheduler job')

    try {
      const job = await this.client.cloudscheduler('v1beta1').projects.locations.jobs.pause({ name })

      return format(job, 'job')
    } catch (e) {
      console.log(e)
      return { error: 'Something went wrong' }
    }
  }

  resumeSchedulerJob = async (name: string) => {
    console.log('Resuming Cloud Scheduler job')

    try {
      const job = await this.client.cloudscheduler('v1beta1').projects.locations.jobs.resume({ name })

      return format(job, 'job')
    } catch (e) {
      console.log(e)
      return { error: 'Something went wrong' }
    }
  }

  deleteSchedulerJob = async (name: string) => {
    console.log('Deleting Cloud Scheduler job')

    try {
      await this.client.cloudscheduler('v1beta1').projects.locations.jobs.delete({ name })
      return {}
    } catch (e) {
      console.log(e)
      return { error: 'Something went wrong' }
    }
  }

  storage = async (projectId: string) => {
    console.log('Listing Storage buckets')

    try {
      const buckets = await this.client.storage('v1').buckets.list({
        project: projectId,
      })

      return { buckets: buckets.data.items }
    } catch (e) {
      const error = format(e.response, 'error')
      return { error: error ? error.message : null }
    }
  }

  translation = async () => {
    console.log('Checking Translation API availability')

    try {
      await this.client.translate('v2').languages.list()
      return {}
    } catch (e) {
      if (e.toString().includes('has not been used')) {
        return { disabled: true }
      }

      const error = format(e.response, 'error')
      return { error: error ? error.message : null }
    }
  }

  vision = async () => {
    console.log('Checking Cloud Vision API availability')

    try {
      await this.client.vision('v1').images.annotate({
        requestBody: {
          requests: [{ image: { content: pixel } }]
        }
      })

      return {}
    } catch (e) {
      if (e.toString().includes('has not been used')) {
        return { disabled: true }
      }

      const error = format(e.response, 'error')
      return { error: error ? error.message : null }
    }
  }

  videoIntelligence = async () => {
    console.log('Checking Video Intelligence API availability')

    try {
      await this.client.videointelligence('v1').videos.annotate({
        requestBody: {
          inputContent: pixel
        }
      })

      return {}
    } catch (e) {
      if (e.toString().includes('has not been used')) {
        return { disabled: true }
      }

      const error = format(e.response, 'error')
      return { error: error ? error.message : null }
    }
  }

  firestore = async (projectId: string) => {
    console.log('Checking Firestore availability')

    try {
      await this.client.firestore('v1').projects.locations.list({
        name: `projects/${projectId}`
      })

      return {}
    } catch (e) {
      if (e.toString().includes('Error 404 (Not Found)')) {
        return { disabled: true }
      }

      const error = format(e.response, 'error')
      return { error: error ? error.message : null }
    }
  }

  firebaseWebApps = async (projectId: string) => {
    console.log('Fetching Firebase Web Apps')

    try {
      const webapps = await this.auth.request({
        url: `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`
      })

      return { webapps: (webapps.data as any).apps || [] }
    } catch (e) {
      console.log('WAPPS_ERR', JSON.stringify(e, null, 2))
      if (e.toString().includes('has not been used') || e.toString().includes('Error 404 (Not Found)')) {
        return { disabled: true }
      }

      const error = format(e.response, 'error')
      if (error && error.message && error.message.includes('has not been used')) {
        return { disabled: true }
      }

      return { error: error ? error.message : null }
    }
  }

  firebaseWebAppConfig = async (appId: string, projectId: string) => {
    console.log('Fetching Firebase Web App config')

    try {
      const config = await this.auth.request({
        url: `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps/${appId}/config`
      })

      return { config: config.data }
    } catch (e) {
      const error = format(e.response, 'error')
      return { error: error ? error.message : null }
    }
  }

  createFirebaseWebApp = async (name: string, projectId: string) => {
    console.log('Creating Firebase Web App')

    if (!name) {
      return { error: 'App name is required' }
    }

    try {
      await this.auth.request({
        url: `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name })
      }) as any

      const apps = await this.firebaseWebApps(projectId)
      const app = (apps as any).find(({ displayName }: any) => displayName === name)

      if (!app) {
        return { error: 'An unexpected error has occurred' }
      }

      const config = await this.firebaseWebAppConfig(app.appId, projectId)

      return { app, config }
    } catch (e) {
      const error = format(e.response, 'error')
      return { error: error ? error.message : null }
    }
  }

  sql = async (projectId: string) => {
    console.log('Fetching Cloud SQL instances')

    try {
      const instances = await this.client.sqladmin('v1beta4').instances.list({
        project: projectId
      })

      return { instances: format(instances, 'items') }
    } catch (e) {
      if (e.toString().includes('has not been used')) {
        return { disabled: true }
      }

      const error = format(e.response, 'error')
      return { error: error ? error.message : null }
    }
  }

  createSQLInstance = async (projectId: string, data: any) => {
    console.log('Creating Cloud SQL instance')

    try {
      await this.client.sqladmin('v1beta4').instances.insert({
        project: projectId,
        requestBody: {
          name: data.name,
          region: data.region,
          settings: { tier: data.postgres ? 'db-pg-f1-micro' : 'db-f1-micro' },
          databaseVersion: data.postgres ? 'POSTGRES_9_6' : undefined
        }
      })
    } catch (e) {
      const error = format(e.response, 'error')
      return { error: error ? error.message : null }
    }
  }

  deleteSQLInstance = async (projectId: string, name: string) => {
    console.log('Deleting Cloud SQL instance')

    try {
      await this.client.sqladmin('v1beta4').instances.delete({
        project: projectId,
        instance: name,
      })
    } catch (e) {
      const error = format(e.response, 'error')
      return { error: error ? error.message : null }
    }
  }

  createSQLCredentials = async (projectId: string, instance: string) => {
    console.log('Creating Cloud SQL credentials')

    try {
      const instanceState = await this.client.sqladmin('v1beta4').instances.get({ project: projectId, instance, })
      if (instanceState.data.ipAddresses && instanceState.data.ipAddresses.length > 0) {
        const ip = instanceState.data.ipAddresses[0].ipAddress
        const name = await uid(8)
        const password = await uid(24)
        await this.client.sqladmin('v1beta4').users.insert({
          project: projectId,
          instance,
          requestBody: {
            host: '%',
            name,
            password,
          }
        })

        return { name, password, ip }
      }

      return { error: "Instance is not ready or doesn't have a public address" }
    } catch (e) {
      console.log('sqle', e)
      if (e.toString().includes('has not been used')) {
        return { disabled: true }
      }

      const error = format(e.response, 'error')
      return { error: error ? error.message : null }
    }
  }

  removeSQLCredentials = async (projectId: string, instance: string, name: string) => {
    console.log('Removing Cloud SQL credentials')

    try {
      await this.client.sqladmin('v1beta4').users.delete({
        project: projectId,
        instance,
        name,
        host: '%'
      })
    } catch (e) {
      console.log('sqle', e)
      if (e.toString().includes('has not been used')) {
        return { disabled: true }
      }

      const error = format(e.response, 'error')
      return { error: error ? error.message : null }
    }
  }

  // private refreshTokens = async (newTokens: Credentials) => {
  //   await ZEIT.saveMetadata({
  //     auth: {
  //       ...this.auth.credentials,
  //       access_token: newTokens.access_token
  //     }
  //   }, this.zeitToken, this.zeitTeamId)
  //   this.auth.setCredentials(newTokens)
  //   this.client.options({
  //     auth: this.auth
  //   })
  // }

  // prepare = async (zeitVitals: ZEITVitals, addToProjects?: boolean): Promise<GoogleCredentials> => {
  //   // If we already have credentials, pass them through
  //   if (this.options.googleCredentials) {
  //     console.log('Reusing provided credentials')
  //     return this.options.googleCredentials;
  //   }

  //   const zeitId = (zeitVitals.id || zeitVitals.uid).toLowerCase().replace(/\d/g, '') // Google IDs need to be lowercase without numbers
  //   const googleCredentials = await createServiceAccount(`zeit-${zeitId}`) as GoogleCredentials

  //   // In case of OAuth, we want to add service account to user's projects so we can work with them via service account directly
  //   if (addToProjects) {
  //     console.log('Adding service account to projects')

  //     const projects = await this.projects()

  //     await Promise.all(projects.map(async (project) => {
  //       const policy = await getIamPolicy(project.projectId as string, this.auth.credentials.access_token as string)
  //       const updatedPolicy = extendPolicy(policy, googleCredentials.serviceAccount.email as string)

  //       await this.client.cloudresourcemanager('v1').projects.setIamPolicy({
  //         resource: project.projectId,
  //         requestBody: {
  //           policy: updatedPolicy
  //         }
  //       })
  //     }))
  //   }

  //   // Set service account as an authentication method from now on
  //   this.auth.removeListener('tokens', this.refreshTokens)
  //   this.auth = createAuthClient({ googleCredentials })
  //   this.client.options({ auth: this.auth })

  //   console.log('Google credentials ready')
  //   return googleCredentials
  // }
}
