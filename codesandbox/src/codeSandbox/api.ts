/**
 * CodeSandbox custom API implementation using the same endpoints from the codesandbox CLI and
 * not the current API from their documentation because it has multiple limitations with
 * medium-large projects and images
 */
import Datauri from 'datauri';
import { FetchOptions } from '@zeit/fetch';
import { ISandbox } from 'codesandbox-import-util-types';
import { decamelizeKeys } from 'humps';
import { fetch } from '../lib/utils';
import { UIError } from '../types';
import { User, Uploads, Files } from './types';

// CodeSandbox url for dev mode, the API in there has been updated so they don't match
// const API_URL = 'https://codesandbox.stream';
const API_URL = 'https://codesandbox.io';

export async function fetchCodeSandboxApi(path: string, options: FetchOptions) {
  const res = await fetch(API_URL + path, options);
  const data = await res.json();

  if (res.status !== 200) {
    const { errors } = data;
    throw new UIError(
      `CodeSandbox API Error: ${(errors && errors[0]) || 'Internal server error'}`,
      { status: res.status, code: 'API_ERROR' }
    );
  }

  return data.data;
}

export function verifyAuthToken(token: string): Promise<{ user: User; token: string }> {
  const path = `/api/v1/auth/verify/${token}`;
  return fetchCodeSandboxApi(path, { method: 'GET' });
}

export function uploadFile(
  token: string,
  { name, buffer }: { name: string; buffer: Buffer }
): Promise<{ id: string; url: string }> {
  const path = '/api/v1/users/current_user/uploads';

  const datauri = new Datauri();
  datauri.format(name, buffer);
  const uri = datauri.content;

  return fetchCodeSandboxApi(path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: { name, content: uri } as any
  });
}

export async function uploadFiles(token: string, uploads: Uploads) {
  const operations = Object.keys(uploads).map(async path => {
    const { url } = await uploadFile(token, { name: path, buffer: uploads[path] });
    return { path, url };
  });
  const result = await Promise.all(operations);

  return result.reduce<Files>((files, file) => {
    files[file.path] = {
      content: file.url,
      isBinary: true
    };
    return files;
  }, {});
}

export function uploadSandbox(token: string, sandbox: ISandbox): Promise<{ id: string }> {
  const path = '/api/v1/sandboxes';

  return fetchCodeSandboxApi(path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: {
      sandbox: {
        ...decamelizeKeys(sandbox),
        from_cli: true
      }
    } as any
  });
}
