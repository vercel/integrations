declare interface ZEITUser {
  uid: string;
  email: string;
  username: string;
  name: string;
  bio: string;
  date: string;
  billingChecked: boolean;
  avatar: string;
  github: boolean;
}

declare interface ZEITTeam {
  id: string;
  slug: string;
  name: string;
  creatorId: string;
  created: string;
  avatar: string;
}

declare type ZEITVitals = ZEITUser & ZEITTeam

declare interface SQLCredential {
  ipVar: string;
  usernameVar: string;
  passwordVar: string;
  ipSecret: string;
  usernameSecret: string;
  passwordSecret: string;
  username: string;
}

declare interface GoogleCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

declare interface ConfigItem {
  googleCredentials?: GoogleCredentials;
  secret?: string;
  linkedProject?: string;
  sqlCredentials?: {
    [key: string]: SQLCredential;
  };
}

declare interface Config {
  // auth?: {
  //   access_token: string;
  //   refrest_token: string;
  // };
  [key: string]: ConfigItem;
}