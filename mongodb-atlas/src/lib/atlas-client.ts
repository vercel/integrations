import DFetch from 'digest-fetch';
import { Response } from 'node-fetch';
import { FetchOptions } from '../types';

interface ClientOptions {
  username: string;
  apiKey: string;
}

export default class AtlasClient {
  options: ClientOptions;
  client: any;

  constructor(options: ClientOptions) {
    this.options = options;
    this.client = new DFetch(options.username, options.apiKey);
  }

  fetch(path: string, options: FetchOptions) {
    const apiUrl = `https://cloud.mongodb.com/api/atlas/v1.0${path}`;
    if (options.data) {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
      };
      options.body = JSON.stringify(options.data);
    }

    return this.client.fetch(apiUrl, options) as Promise<Response>;
  }

  async fetchAndThrow(path: string, options: FetchOptions) {
    const res = await this.fetch(path, options);
    if (res.status !== 200) {
      throw new Error(
        `Failed Atlas API call. path: ${path} status: ${
          res.status
        } error: ${await res.text()}`
      );
    }

    const response = await res.json();
    // Handling a list
    // TODO: Implement pagination support.
    if (response.links && response.results) {
      return response.results;
    }

    return response;
  }

  async authCheck() {
    const res = await this.fetch('/groups', { method: 'GET' });
    return res.status === 200;
  }
}
