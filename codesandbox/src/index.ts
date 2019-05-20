import { withUiHook } from '@zeit/integration-utils';
import { addErrorById } from './lib/utils';
import { SETUP, LOGOUT, CREATE_SANDBOX, equalsAction, actionArgs } from './actions/utils';
import createSandbox from './actions/createSandbox';
import verifyUser from './actions/verifyUser';
import logout from './actions/logout';
import projectRequiredView from './views/projectRequired';
import dashboardView from './views/dashboard';
import setupView from './views/setup';
import { Metadata, ViewOptions, UIError } from './types';

export default withUiHook(async options => {
  const { action, projectId } = options.payload;

  if (!projectId) {
    return projectRequiredView();
  }

  const metadata: Metadata = await options.zeitClient.getMetadata();
  const viewOptions: ViewOptions = { options, metadata };

  if (action === SETUP) {
    try {
      await verifyUser(viewOptions);
    } catch (e) {
      console.error('ERROR', e);
      if (!(e instanceof UIError)) {
        throw e;
      }
      // Invalid token
      if (e.status === 422) {
        e.message = 'Invalid auth token';
      }
      viewOptions.errors = { setupError: e };
    }
  } else if (action === LOGOUT) {
    await logout(viewOptions);
  }

  if (!metadata.sandboxes) metadata.sandboxes = {};
  if (!metadata.token) {
    return setupView(viewOptions);
  }

  if (equalsAction(action, CREATE_SANDBOX)) {
    const [id] = actionArgs(action);

    try {
      await createSandbox(viewOptions, id);
    } catch (e) {
      if (!e.id) e.id = id;

      console.error('ERROR', e);

      if (e.code === 'ETIMEDOUT') {
        e = new UIError('ZEIT API timed out, try again please 🙏', e);
      }
      if (!(e instanceof UIError)) {
        throw e;
      }
      // Auth expired
      if (e.status === 401) {
        await logout(viewOptions);
        return setupView(viewOptions);
      }

      addErrorById(viewOptions, id, e);
    }
  }

  return dashboardView(viewOptions);
});
