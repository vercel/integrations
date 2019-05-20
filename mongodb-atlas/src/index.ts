import { withUiHook } from '@zeit/integration-utils';
import { HandlerOptions } from '@zeit/integration-utils';
import { ViewInfo } from './types';

import setupView from './views/setup';
import newClusterView from './views/new-cluster';
import AtlasClient from './lib/atlas-client';
import dashboardView from './views/dashboard';

async function getContent(options: HandlerOptions) {
	const { payload, zeitClient } = options;
  const { action } = payload;

  const metadata = await zeitClient.getMetadata();
  const viewInfo: ViewInfo = { metadata, zeitClient, payload };

  if (!metadata.connectionInfo) {
    return setupView(viewInfo);
  }

  if (action === 'new-cluster') {
    return newClusterView(viewInfo);
  }

  viewInfo.atlasClient = new AtlasClient(metadata.connectionInfo);
  return dashboardView(viewInfo);
}

const handler = async (options: HandlerOptions) => {
	const jsx = await getContent(options);
	return `<Page>${jsx}</Page>`;
}

export default withUiHook(handler);
