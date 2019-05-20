const { withUiHook, htm } = require('@zeit/integration-utils')
const axios = require('axios');
const { produce } = require('immer');

let apiKey;

const api = async (apiKey, endpoint, opts = {}) => {
  const method = opts.method || 'get'
  const config = {
    ...opts,
    url: 'https://customer.cloudamqp.com/api/' + endpoint,
    method,
    auth: {
      username: '',
      password: apiKey,
    }
  };
  res = await axios.request(config);
  return res.data;
}

const formatInstance= (i) =>
  `${i.name} (${i.plan} at ${i.region})`

const Settings = ({ store: { apiKey }}) => htm`
  <H1>Global Settings</H1>
  <Fieldset>
    <FsContent>
      <Input label="API Key (CloudAMQP Customer API)" name="apiKey" value=${apiKey ? apiKey : ''} errored=${typeof apiKey !== 'string' || apiKey.length === 0}/>
    </FsContent>
  </Fieldset>`

const ProjectSettings = ({ rabbitInstances, project, binding, consoleApiKey, endpoint }) => htm`
  <H1>Project Settings</H1>
  <Fieldset>
    <FsContent>
      Select a RabbitMQ instance to make available to all <B>${project.name}</B> deployments
      <Select name="selectedInstance" value=${binding && binding.id}>
        <Option value="-1" caption="(none)" />
        ${
          rabbitInstances.map((instance) => htm`
            <Option value=${instance.id} caption=${formatInstance(instance)}} />
          `)
        }
      </Select>
      <Button action="refresh" small>Refresh</Button>
    </FsContent>
    <FsFooter>
      ${!binding ? '' : htm`✅ You can now use CLOUDAMQP_URL to connect to the ${binding.name} RabbitMQ cluster`}
    </FsFooter>
  </Fieldset>
  ${
    !binding ?
      '' :
      htm`
      <H1>Webhooks</H1>
      <Fieldset>
        <FsContent>
          <P>
            You can use this integration to automatically have CloudAMQP hit
            your deployment for processing of queue items. In order for us to
            set up the webhook we need the Console API key as explained at
            <Link href="https://www.cloudamqp.com/docs/api.html">https://www.cloudamqp.com/docs/api.html</Link>
          </P>
          <Input label=${`Console API Key for the ${binding.name} cluster`} name="consoleApiKey" value=${consoleApiKey ? consoleApiKey : ''} />
          ${
            !consoleApiKey ?
              '' :
              htm`<Input label=${`Endpoint (default: /)`} name="endpoinnt" value=${endpoint ? endpoint : ''} />`
          }
        </FsContent>
      </Fieldset>
    `
  }
  `

const actions = {
  async save(state, zeit) {
    // Save global settings
    const apiKey = state.clientState.apiKey
    state.store.apiKey = apiKey;

    // Save project settings
    if (state.project) {
      const { selectedInstance } = state.clientState;
      const instanceId = selectedInstance === '-1' ? undefined : selectedInstance;
      state.store.bindings[state.project.id] = instanceId && await api(apiKey, `instances/${instanceId}`);

      if (instanceId) {
        // Save console API for this cluster
        const consoleApiKeys = state.store.consoleApiKeys || {};
        consoleApiKeys[instanceId] = state.clientState.consoleApiKey;
        state.store.consoleApiKeys = consoleApiKeys;

        // Create a secret and env variable
        const { url } = state.store.bindings[state.project.id];
        const secretName = await zeit.ensureSecret('cloudamqp_url_' + instanceId, url)
        await zeit.upsertEnv(state.project.id, 'CLOUDAMQP_URL', secretName)
      }
    }
    state.message = 'Saved';
  },
  async refresh(state) {
    state.store.rabbitInstances = await api(state.store.apiKey, 'instances')
    state.message = 'Instance list refreshed';
  }
}

const handleAction = async (action, state, zeit) => {
  return await produce(state, async (draftState) => {
    await actions[action](draftState, zeit);
  });
}

module.exports = withUiHook(async ({ payload, zeitClient: zeit }) => {
  const { clientState, action, project } = payload;
  const oldStore = (await zeit.getMetadata()) || {};

  let state = { store: oldStore, clientState, project };

  // Make sure we've loaded the instances
  if (state.store.apiKey && !state.store.rabbitInstances && action !== 'refresh') {
    state = await handleAction('refresh', state, zeit);
  }

  // Run the current action
  if (actions[action]) {
    state = await handleAction(action, state, zeit);
  }

  const { store } = state;

  // Save store if changed by the action
  if (store !== oldStore) {
    await zeit.setMetadata(store);
  }

  const binding = store.bindings[project.id];
  const consoleApiKey = binding && store.consoleApiKeys ? store.consoleApiKeys[binding.id] : null

  return htm`
    <Page>
      ${state.message ? htm`<Notice>${state.message}</Notice>`: ''}
      <${Settings} store=${store}/>
      ${project ?
          htm`<${ProjectSettings}
            rabbitInstances=${store.rabbitInstances}
            project=${project}
            consoleApiKey=${consoleApiKey}
            binding=${binding}/>`:
          htm`<Notice>Select a project to configure</Notice>`}
      <Container>
        <Button action="save">Save</Button>
      </Container>
      Store:
      <Code value=${encodeURIComponent(JSON.stringify(store, null, ' '))} />
      Payload
      <Code value=${encodeURIComponent(JSON.stringify(payload, null, ' '))} />
    </Container>
  `
})
