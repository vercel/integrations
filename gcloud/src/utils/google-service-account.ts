import { google, cloudresourcemanager_v1, iam_v1 } from 'googleapis'
import { fromB64 } from './auth-tools';
import { JWT } from 'google-auth-library';
import fetch from 'node-fetch';

const { PROJECT_ID, INTEGRATION_CREDENTIALS } = process.env

const getCredentials = () => {
  const json = fromB64(INTEGRATION_CREDENTIALS as string)
  return JSON.parse(json)
}

export default async function createServiceAccount(name: string) {
  // Create integration-level service account for the user upon installation
  const auth = google.auth.fromJSON(getCredentials()) as JWT
  auth.scopes = 'https://www.googleapis.com/auth/cloud-platform'

  const { data: serviceAccount } = await google.iam('v1').projects.serviceAccounts.create({
    auth,
    name: `projects/${PROJECT_ID}`,
    requestBody: {
      accountId: name,
      serviceAccount: {
        description: 'ZEIT Integration Service Account',
        displayName: 'ZEIT Integration'
      }
    }
  })

  return serviceAccount
}

export const createServiceAccountKey = async (serviceAccount: string) => {
  const auth = google.auth.fromJSON(getCredentials()) as JWT
  auth.scopes = 'https://www.googleapis.com/auth/cloud-platform'

  const { data: serviceAccountKey } = await google.iam('v1').projects.serviceAccounts.keys.create({
    auth,
    name: serviceAccount
  })

  return serviceAccountKey
}

export const getCredentialsFromKey = (serviceAccountKey: iam_v1.Schema$ServiceAccountKey) => {
  return JSON.parse(fromB64(serviceAccountKey.privateKeyData as string))
}

export const getIamPolicy = async (projectId: string, token: string) => {
  const res = await fetch(`https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:getIamPolicy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  return res.json()
}

// Merge existing policy with service account permissions
export const extendPolicy = (policy: cloudresourcemanager_v1.Schema$Policy, serviceAccountEmail: string) => {
  const { bindings = [] } = policy
  const ownerRole = bindings.find(({ role }) => role === 'roles/owner') || { role: 'roles/owner', members: [] }

  // Extract owner role from bindings
  const tempBindings = bindings.filter(({ role }) => role !== 'roles/owner')

  const members = ownerRole.members || []
  members.push(`serviceAccount:${serviceAccountEmail}`)
  tempBindings.push({ ...ownerRole, members })

  return { ...policy, bindings: tempBindings }
}

export const isValidServiceAccount = (account: any): boolean => {
  if (typeof account !== 'object') {
    return false
  }

  const fields = new Set([
    'type',
    'project_id',
    'private_key_id',
    'private_key',
    'client_email',
    'client_id',
    'auth_uri',
    'token_uri',
    'auth_provider_x509_cert_url',
    'client_x509_cert_url',
  ])

  let valid = true

  fields.forEach(field => {
    if (typeof account[field] !== 'string') {
      valid = false
    }
  })

  return valid
}
