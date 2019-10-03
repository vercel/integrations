import { ViewInfo } from '../types';
import uuid from 'uuid';

export default async function prepareAtlas(viewInfo: ViewInfo) {
  const { atlasClient, zeitClient, metadata, payload } = viewInfo;

  // Abort if it's already prepared
  if (metadata.atlasPrepared) {
    return;
  }

  // get the project and keep it in the metadata
  const [project] = await atlasClient!.fetchAndThrow('/groups', {
    method: 'GET'
  });
  if (!project) {
    const error = new Error('No project found on this account');
    throw error;
  }
  metadata.project = project;

  // add ip whitelisting
  const ipRes = await atlasClient!.fetch(`/groups/${project.id}/whitelist`, {
    method: 'POST',
    data: [{ cidrBlock: '0.0.0.0/0', comment: 'zeit-now-all-access' }]
  });
  if (ipRes.status !== 201) {
    throw new Error(`IP Whitelisting failed: ${await ipRes.text()}`);
  }

  // set the db user information of metatdata
  const zeitAccountId = payload.team ? payload.team.id : payload.user.id;
  const dbUser = {
    username: `zeit-${zeitAccountId}`,
    password: uuid.v4()
  };
  metadata.dbUser = dbUser;

  // delete the user if exists
  const deleteRes = await atlasClient!.fetch(
    `/groups/${project.id}/databaseUsers/admin/${dbUser.username}`,
    { method: 'DELETE' }
  );
  if (deleteRes.status !== 404 && deleteRes.status !== 204) {
    throw new Error(
      `dbUser deletion error: [${deleteRes.status}] ${await deleteRes.text()}`
    );
  }

  // create the user
  const createRes = await atlasClient!.fetch(
    `/groups/${project.id}/databaseUsers`,
    {
      method: 'POST',
      data: {
        databaseName: 'admin',
        groupId: project.id,
        username: dbUser.username,
        roles: [{ databaseName: 'admin', roleName: 'atlasAdmin' }],
        password: dbUser.password
      }
    }
  );
  if (createRes.status !== 201) {
    throw new Error(
      `DbUser creation error: [${createRes.status}] ${await createRes.text()}`
    );
  }

  // add a mark to set the preparation completed
  metadata.atlasPrepared = true;

  // update metatdata
  await zeitClient.setMetadata(metadata);
}
