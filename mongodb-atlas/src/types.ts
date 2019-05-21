import AtlasClient from './lib/atlas-client';
import { RequestInit } from 'node-fetch';
import { ZeitClient, UiHookPayload } from '@zeit/integration-utils';

export interface ViewInfo {
  metadata: any;
  payload: UiHookPayload;
  zeitClient: ZeitClient;
  atlasClient?: AtlasClient | null | undefined;
}

export interface FetchOptions extends RequestInit {
  data?: object;
}

export interface AtlasCluster {
  id: string;
  groupId: string;
  name: string;
  stateName: string;
  numShards: string;
  paused: boolean;
  diskSizeGB: number;
  providerSettings: {
    providerName: string;
    backingProviderName?: string | null;
    regionName: string;
    instanceSizeName: string;
    diskIOPS: number;
  };
  srvAddress?: string | null;
}
