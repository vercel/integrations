/**
 * A abstraction class for ZEIT integration utils
 * Receives payload and client from WithUiHook and makes them neat
 */

import { ZeitClient, FetchOptions, UiHookPayload, HandlerOptions } from '@zeit/integration-utils'
import fetch from 'node-fetch'
import { toB64 } from './auth-tools';

// So we know what kind of error it was
class ZEITError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ZEITError'
  }
}

interface Obj { [key: string]: any }

const standaloneFetch = async (url: string, token: string, options: FetchOptions = {}) => {
  options.headers = options.headers ? {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  } : {
    Authorization: `Bearer ${token}`,
  }

  if (options.method === 'POST') {
    // @ts-ignore
    options.headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(url, options)

  return res.json()
}

export default class ZEIT {
  static async saveMetadata(metadata: any, token: string, teamId?: string | null): Promise<any> {
    return standaloneFetch(`https://api.zeit.co/v1/integrations/installation/gcloud/metadata${teamId ? `?teamId=${teamId}` : ''}`, token, {
      method: 'POST',
      body: JSON.stringify(metadata)
    })
  }

  static async getVitals(token: string, teamId?: string): Promise<any> {
    if (teamId) {
      const { teams } = await standaloneFetch('https://api.zeit.co/teams', token)
      const team = teams.find((t: any) => t.id === teamId)

      return team
    }
    return standaloneFetch('https://api.zeit.co/www/user', token)
  }

  constructor({ zeitClient: client, payload }: HandlerOptions) {
    this.client = client
    this.payload = payload
    this.action = payload.action === 'view' ? null : payload.action // Don't consider 'view' an action since it's just a render
    this.teamId = payload.teamId
    this.projectId = payload.projectId

    console.log('ZEIT client ready')
  }

  private client: ZeitClient;
  private payload: UiHookPayload;
  action?: string | null;
  teamId?: string | null;
  projectId?: string | null;

  private request = async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
    const res = await this.client.fetch(path, options)
    const { error, ...result } = await res.json()

    if (error) {
      throw new ZEITError(JSON.stringify(error))
    }

    return result as T
  }

  vitals = async (): Promise<ZEITVitals> => {
    console.log(`Fetching vitals${this.teamId ? ` for team` : ''}`)

    if (this.teamId) {
      const { teams } = await this.request('/teams')
      const team = teams.find((t: any) => t.id === this.teamId)

      return team
    }

    const { user } = await this.request('/www/user')

    return user
  }

  config = async (): Promise<Config> => this.client.getMetadata()

  saveConfig = async (newConfig: Obj): Promise<Obj> => {
    const config = await this.config()
    const mergedConfig = { ...config, ...newConfig }

    await this.client.setMetadata(mergedConfig)

    console.log('Config saved')

    return mergedConfig
  }

  deploymentsInCurrentProject = async () => {
    console.log('Fetching deployments in current project')

    const { deployments } = await this.request(`/v4/now/deployments?projectId=${this.projectId}&limit=50`, {
      teamId: this.teamId
    } as any)

    return deployments
  }

  listProjects = async () => {
    console.log('Fetching user projects')

    const res = await this.client.fetch(`/projects/list?limit=500`, {
      teamId: this.teamId
    } as any)

    const projects = await res.json()

    if (projects.error) {
      throw new ZEITError(JSON.stringify(projects.error))
    }

    return projects
  }

  // Extract fields from the `clientState`
  get = (field: string) => this.payload.clientState[field]

  getToken = () => this.payload.token

  getClientState = () => this.payload.clientState

  // Encode and save Google Cloud credentials to the Now Secrets
  ensureCredentials = async (googleProjectId: string, value: any) => {
    if (this.projectId) {
      const config = await this.config()
      const projectSettings = config[this.projectId]
      const { secret } = projectSettings

      // Credential exists
      if (secret) {
        return
      }

      const credentials = toB64(JSON.stringify(value))
      const secretName = await this.client.ensureSecret(`gcloud-${googleProjectId}`, credentials)
      projectSettings.secret = secretName

      await this.saveConfig({
        ...config,
        [this.projectId]: projectSettings
      })
      return secretName
    }
  }

  addCredentialsToProject = async () => {
    if (this.projectId) {
      const config = await this.config()
      const projectSettings = config[this.projectId]

      if (projectSettings.secret) {
        await this.client.upsertEnv(this.projectId, 'GCLOUD_CREDENTIALS', projectSettings.secret)
      }
    }
  }

  removeCredentialsFromProject = async () => {
    if (this.projectId) {
      await this.client.removeEnv(this.projectId, 'GCLOUD_CREDENTIALS')
    }
  }

  checkCredentials = async () => {
    if (this.projectId) {
      const envVars: any = await this.client.fetch(`/projects/${this.projectId}/env`, {
        teamId: this.teamId
      } as any)

      const env = await envVars.json()
      
      if (!Array.isArray(env)) {
        return false
      }

      const credentials = env.find(({ key }: any) => key === 'GCLOUD_CREDENTIALS')

      if (credentials) {
        return true
      }

      return false
    }

    return false
  }

  // Burn all the data in the current project
  clearSecrets = async () => {
    if (this.projectId) {
      const config = await this.config()
      delete config[this.projectId]

      await this.saveConfig(config)
    }
  }

  saveSQLCredentials = async (credentials: { ip: string; password: string; name: string; instanceName: string }) => {
    if (this.projectId) {
      const { instanceName } = credentials

      const [ipSecret, usernameSecret, passwordSecret] = await Promise.all([
        this.client.ensureSecret(`sql-${instanceName}-ip`, credentials.ip),
        this.client.ensureSecret(`sql-${instanceName}-username`, credentials.name),
        this.client.ensureSecret(`sql-${instanceName}-password`, credentials.password),
      ])

      const ipVar = `SQL_${instanceName.toUpperCase().replace(/-/g, '_')}_IP`
      const usernameVar = `SQL_${instanceName.toUpperCase().replace(/-/g, '_')}_USERNAME`
      const passwordVar = `SQL_${instanceName.toUpperCase().replace(/-/g, '_')}_PASSWORD`

      await Promise.all([
        this.client.upsertEnv(this.projectId, ipVar, ipSecret),
        this.client.upsertEnv(this.projectId, usernameVar, usernameSecret),
        this.client.upsertEnv(this.projectId, passwordVar, passwordSecret),
      ])

      return {
        ipVar, usernameVar, passwordVar,
        // For easy disposal:
        ipSecret, usernameSecret, passwordSecret,
        username: credentials.name,
      }
    }
  }

  removeSQLCredentials = async (credentials: SQLCredential) => {
    if (this.projectId) {
      await Promise.all([
        // Clear secrets
        this.request(`/v2/now/secrets/${credentials.ipSecret.replace('@', '')}`, { method: 'DELETE' }),
        this.request(`/v2/now/secrets/${credentials.usernameSecret.replace('@', '')}`, { method: 'DELETE' }),
        this.request(`/v2/now/secrets/${credentials.passwordSecret.replace('@', '')}`, { method: 'DELETE' }),
        // Clear env
        this.client.removeEnv(this.projectId, credentials.ipVar),
        this.client.removeEnv(this.projectId, credentials.usernameVar),
        this.client.removeEnv(this.projectId, credentials.passwordVar),
      ])
    }
  }
}
