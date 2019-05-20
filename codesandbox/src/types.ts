import { HandlerOptions } from '@zeit/integration-utils';
import { User } from './codeSandbox/types';

export interface Deployment {
  uid: string;
  url: string | null;
}

export interface DeploymentFile {
  name: string;
  type: 'file';
  mode: number;
  uid: string;
}

export interface DeploymentDir {
  name: string;
  type: 'directory';
  mode: number;
  children: File[];
}

export type File = DeploymentFile | DeploymentDir;

export type Metadata = {
  token?: string;
  user: User;
  sandboxes: {
    [id: string]: string | undefined;
  };
};

export type ViewOptions = {
  options: HandlerOptions;
  metadata: Metadata;
  errors?: {
    setupError?: UIError;
    byId?: {
      [id: string]: UIError | undefined;
    };
  };
};

export class UIError extends Error {
  readonly code: string;
  readonly status?: number;
  public id?: string;

  constructor(
    message: string,
    { code, status, id }: { code?: string; status?: number; id?: string } = {}
  ) {
    super(message);

    this.code = code || 'UI_ERROR';
    this.status = status;
    this.id = id;
  }
}
