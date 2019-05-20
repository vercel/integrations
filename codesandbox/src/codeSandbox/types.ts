export type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar_url: string;
};

export type RawFile = {
  path: string;
  content: Buffer;
};

export type Uploads = {
  [path: string]: Buffer;
};

export type Files = {
  [path: string]: {
    content: string;
    isBinary: boolean;
  };
};
