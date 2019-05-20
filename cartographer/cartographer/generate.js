/* eslint complexity: "off" */
/* eslint no-underscore-dangle: "off" */

const ZeitClient = require('@zeit/integration-utils/lib/zeit-client.js').default;
const assert = require('assert');
const { Sema } = require('async-sema');

const MAX_DEPLOYMENTS = 200;
const MAX_DEPLOYMENTS_TO_ENHANCE = 100;

function reduce2 (list, p) {
  return list.reduce((a, b) => {
    a[p(b)] = b;
    return a;
  }, {});
}

function idify (s) {
  return s.replace(/"/g, '_');
}

function labelify (s) {
  return s.replace(/"/g, '\\"');
}

async function generateZeitData (zeitClient) {
  console.error('domains');
  const { domains } = await zeitClient.fetchAndThrow('/v4/domains', { method: 'GET' });

  const domainsSubgraphs = {};
  for (const domain of domains) {
    domainsSubgraphs[domain.name] = [];
    // console.log(await zeitClient.fetchAndThrow(`/v2/domains/${domain.name}/records`, { method: 'GET' }));
  }

  console.error('aliases');
  const { aliases } = await zeitClient.fetchAndThrow('/v2/now/aliases', { method: 'GET' });
  const aliasesMapByName = reduce2(aliases, (alias) => alias.alias);

  const aliasesNodes = [];
  for (const alias of aliases) {
    const { alias: aliasName } = alias;
    assert(aliasName, JSON.stringify(alias));
    let found = false;

    for (const domainName of Object.keys(domainsSubgraphs)) {
      if (aliasName === domainName ||
          aliasName.endsWith('.' + domainName)) {
        domainsSubgraphs[domainName].push(aliasName);
        found = true;
        break;
      }
    }

    if (!found) {
      aliasesNodes.push(aliasName);
    }
  }

//  console.log(domainsSubgraphs);
//  console.log(aliasesNodes);

  console.error('deployments');
  const { deployments } = await zeitClient.fetchAndThrow('/v3/now/deployments', { method: 'GET' });
  deployments.sort((d1, d2) => d1.created - d2.created); // recent first
  // console.error(JSON.stringify(deployments, null, 2));
  const deploymentsMapById = reduce2(deployments, (deployment) => deployment.uid);
  let deploymentsUsed = 0;

  const deploymentsNamesSubgraphs = {};
  for (const deployment of deployments) {
    const { name: deploymentName, uid: deploymentId } = deployment;

    for (const aliasName of Object.keys(aliasesMapByName)) {
      const alias = aliasesMapByName[aliasName];
      if (alias.deployment && alias.deployment.id === deploymentId) {
        if (!deploymentsNamesSubgraphs[deploymentName]) {
          deploymentsNamesSubgraphs[deploymentName] = [];
        }

        if (!deploymentsNamesSubgraphs[deploymentName].includes(deploymentId)) {
          deploymentsNamesSubgraphs[deploymentName].push(deploymentId);
          deploymentsUsed += 1;
        }
      }
    }
  }

  for (const deployment of deployments) {
    const { name: deploymentName, uid: deploymentId } = deployment;
    let found = false;

    for (const aliasName of Object.keys(aliasesMapByName)) {
      const alias = aliasesMapByName[aliasName];
      if (alias.deployment && alias.deployment.id === deploymentId) {
        found = true;
        break;
      }
    }

    if (!found) {
      if (!deploymentsNamesSubgraphs[deploymentName]) {
        deploymentsNamesSubgraphs[deploymentName] = [];
      }

      const deploymentsNamesSubgraph = deploymentsNamesSubgraphs[deploymentName];
      if (deploymentsNamesSubgraph.length < 1) { // TODO param
        if (!deploymentsNamesSubgraph.includes(deploymentId)) {
          if (deploymentsUsed < MAX_DEPLOYMENTS) {
            deploymentsNamesSubgraph.unshift(deploymentId);
            deploymentsUsed += 1;
          }
        }
      }
    }
  }

  console.error('deployments used', deploymentsUsed);
  console.error('deployments with env vars');
  const deploymentIdsToEnhance = [];
  for (const deploymentName of Object.keys(deploymentsNamesSubgraphs)) {
    const deploymentsNamesSubgraph = deploymentsNamesSubgraphs[deploymentName];
    for (const deploymentId of deploymentsNamesSubgraph) {
      const deployment = deploymentsMapById[deploymentId];
      if (deployment.type === 'LAMBDAS') {
        deploymentIdsToEnhance.push(deploymentId);
      }
    }
  }

  if (deploymentIdsToEnhance.length > MAX_DEPLOYMENTS_TO_ENHANCE) {
    console.error(`decreasing deploymentIdsToEnhance from ${deploymentIdsToEnhance.length} to ${MAX_DEPLOYMENTS_TO_ENHANCE}`);
    deploymentIdsToEnhance.splice(MAX_DEPLOYMENTS_TO_ENHANCE);
  }

  const envsNodes = {};
  const sema = new Sema(30);
  await Promise.all(deploymentIdsToEnhance.map(async (deploymentId) => {
    await sema.acquire();
    try {
      console.error('deployments with env var: ' + deploymentId);
      const d = await zeitClient.fetchAndThrow(`/v8/now/deployments/${deploymentId}`, { method: 'GET' });
      const env = d.env || [];
      const buildEnv = (d.build || {}).env || [];

      const _env = [];
      for (const envName of [ ...env, ...buildEnv ]) {
        if (!_env.includes(envName)) {
          _env.push(envName);
          envsNodes[envName] = {};
        }
      }

      // FIXME dirtily patching
      const deployment = deploymentsMapById[deploymentId];
      deployment._env = _env;
    } finally {
      sema.release();
    }
  }));

  // console.log(envsNodes);

  return { domainsSubgraphs, aliasesMapByName, aliasesNodes, deploymentsMapById, deploymentsNamesSubgraphs, envsNodes };
}

const commonDecoration = {
  shape: 'box',
  fontsize: 7
};

const commonDecorationOfLeaf = Object.assign({}, commonDecoration, {
  margin: '0.02',
  width: 0,
  height: 0
});

const decorationOfDomain = Object.assign({}, commonDecoration, {
  style: 'filled',
  color: 'lightgrey'
});

const decorationOfAlias = Object.assign({}, commonDecorationOfLeaf, {
  style: 'filled',
  color: 'limegreen'
});

const decorationOfNoAliases = Object.assign({}, commonDecorationOfLeaf, {
  style: 'filled',
  color: 'white'
});

const decorationOfDeploymentName = Object.assign({}, commonDecoration, {
  style: 'filled',
  color: 'cyan'
});

const decorationOfDeployment = Object.assign({}, commonDecorationOfLeaf, {
  style: 'filled',
  color: 'pink'
});

const decorationOfEnv = Object.assign({}, commonDecorationOfLeaf, {
  style: 'filled',
  color: 'yellow'
});

function stringifyDecoration (d) {
  assert(typeof d === 'object');
  return Object.keys(d).map((k) => `${k} = ${d[k]};`);
}

async function generateDotFile (zeitClient, options) {
  options = options || {};
  const zeitData = await generateZeitData(zeitClient);
  // const zeitData = JSON.parse(require('fs').readFileSync('_zeit_data.json'));
  // require('fs').writeFileSync('_zeit_data.json', JSON.stringify(zeitData));
  const { domainsSubgraphs, aliasesMapByName, aliasesNodes, deploymentsMapById, deploymentsNamesSubgraphs, envsNodes } = zeitData;
  console.error('generating dot file');

  const dotLines = [];
  dotLines.push('digraph "" {');
  dotLines.push('rankdir = LR;');
  dotLines.push('ranksep = "3 equally";'); // TODO what if minlen?
  dotLines.push('newrank = true;');
  dotLines.push('splines = false;');
  dotLines.push('nodesep = 0.1;');

  const rank1 = [];
  const rank2 = [];
  const rank3 = [];

  // NODES

  for (const domainName of Object.keys(domainsSubgraphs)) {
    if (options.groupAliasesIntoDomains) {
      dotLines.push(`subgraph "cluster_domain_${domainName}" {`);
      dotLines.push(...stringifyDecoration(decorationOfDomain));
      dotLines.push(`label = "${domainName}";`);
    }

    for (const aliasName of domainsSubgraphs[domainName]) {
      const id = `alias_${aliasName}`;
      rank1.push(id);
      dotLines.push(`"${id}" [`);
      dotLines.push(...stringifyDecoration(decorationOfAlias));
      dotLines.push(`label = "${aliasName}";`);
      dotLines.push('];');
    }

    if (options.groupAliasesIntoDomains) {
      if (domainsSubgraphs[domainName].length === 0) {
        const id = `no_aliases_${domainName}`;
        rank1.push(id);
        dotLines.push(`"${id}" [`);
        dotLines.push(...stringifyDecoration(decorationOfNoAliases));
        dotLines.push('label = "NO ALIASES";');
        dotLines.push('];');
      }

      dotLines.push('};');
    }
  }

  for (const aliasName of aliasesNodes) {
    const id = `alias_${aliasName}`;
    rank1.push(id);
    dotLines.push(`"${id}" [`);
    dotLines.push(...stringifyDecoration(decorationOfAlias));
    dotLines.push(`label = "${aliasName}";`);
    dotLines.push('];');
  }

  for (const deploymentName of Object.keys(deploymentsNamesSubgraphs)) {
    const deploymentsNamesSubgraph = deploymentsNamesSubgraphs[deploymentName];

    dotLines.push(`subgraph "cluster_deployment_name_${idify(deploymentName)}" {`);
    dotLines.push(...stringifyDecoration(decorationOfDeploymentName));
    dotLines.push(`label = "${labelify(deploymentName)}";`);

    for (const deploymentId of deploymentsNamesSubgraph) {
      const { url } = deploymentsMapById[deploymentId];
      const id = `deployment_${deploymentId}`;
      rank2.push(id);
      dotLines.push(`"${id}" [`);
      dotLines.push(...stringifyDecoration(decorationOfDeployment));
      dotLines.push(`label = "${url}";`);
      dotLines.push('];');
    }

    dotLines.push('};');
  }

  for (const envName of Object.keys(envsNodes)) {
    const id = `env_${envName}`;
    rank3.push(id);
    dotLines.push(`"${id}" [`);
    dotLines.push(...stringifyDecoration(decorationOfEnv));
    dotLines.push(`label = "${envName}";`);
    dotLines.push('];');
  }

  // CONNECTIONS

  for (const domainName of Object.keys(domainsSubgraphs)) {
    for (const aliasName of domainsSubgraphs[domainName]) {
      const alias = aliasesMapByName[aliasName];
      if (alias.deployment) {
        dotLines.push(`"alias_${aliasName}":e -> "deployment_${alias.deployment.id}":w [dir=none]`);
      }
    }
  }

  for (const aliasName of aliasesNodes) {
    const alias = aliasesMapByName[aliasName];
    if (alias.deployment) {
      dotLines.push(`"alias_${aliasName}":e -> "deployment_${alias.deployment.id}":w [dir=none]`);
    }
  }

  for (const deploymentName of Object.keys(deploymentsNamesSubgraphs)) {
    const deploymentsNamesSubgraph = deploymentsNamesSubgraphs[deploymentName];
    for (const deploymentId of deploymentsNamesSubgraph) {
      const deployment = deploymentsMapById[deploymentId];
      for (const envName of (deployment._env || [])) {
        dotLines.push(`"deployment_${deploymentId}":e -> "env_${envName}":w [dir=none]`);
      }
    }
  }

  // RANKS

  dotLines.push('{ rank=same ' + rank1.map((r) => `"${r}"`).join(' ') + ' }');
  dotLines.push('{ rank=same ' + rank2.map((r) => `"${r}"`).join(' ') + ' }');
  dotLines.push('{ rank=same ' + rank3.map((r) => `"${r}"`).join(' ') + ' }');

  dotLines.push('}');
  return dotLines.join('\n');
}

if (module.parent) {
  module.exports = generateDotFile;
} else {
  (async () => {
    const token = process.env.TOKEN;
    const teamId = 'team_E7YTFLqVsljyHHeBGXnqYsXB';
    const localZeitClient = new ZeitClient({ token, teamId });
    const options = { groupAliasesIntoDomains: true };
    console.log(await generateDotFile(localZeitClient, options));
  })().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
