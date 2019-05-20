const { withUiHook, htm } = require("@zeit/integration-utils");
const ms = require("ms");
const { stringify } = require("querystring");
const { HOST } = require("./lib/env");
const mongo = require("./lib/mongo");

const PROJECTS_LIMIT = 5;
const DEPLOYMENTS_LIMIT = 10;
const ASSUMED_AUDITING_TIME = 10 * 60 * 1000;
const ASSETS_LINK_URL = `${HOST}/assets/link.png`;

function parseDeploymentURL(url) {
  const parts1 = url.split(".");
  const domain = parts1.slice(-2).join(".");
  const subdomain = parts1.slice(0, -2).join(".");

  const parts2 = subdomain.split("-");
  const projectName = parts2.slice(0, -1).join("-");
  const [id] = parts2.slice(-1);

  return {
    domain,
    subdomain,
    projectName,
    id
  };
}

const Score = ({ score, title }) => {
  let color;
  if (score >= 0.9) {
    color = "#178239";
  } else if (score >= 0.5) {
    color = "#e67700";
  } else {
    color = "#c7221f";
  }

  return htm`
    <Box textAlign="center">
      <Box color=${color} fontSize="18px" fontWeight="bold" width="100px">${Math.floor(score *
    100)}</Box>
      <P>${title}</P>
    </Box>
  `;
};

module.exports = withUiHook(
  mongo.withClose(async ({ payload, zeitClient }) => {
    const {
      action,
      installationUrl,
      projectId,
      query,
      slug,
      team,
      user
    } = payload;
    const from = parseInt(query.from, 10) || undefined;
    const ownerId = (team || user).id;

    const dbPromise = mongo();

    if (action && action.startsWith("audit:")) {
      const [, deploymentId] = action.split(":");
      // NOTE: API v6 and higher doesn't support v1 deployments
      const deployment = await zeitClient.fetchAndThrow(
        `/v5/now/deployments/${encodeURIComponent(deploymentId)}`,
        {}
      );
      if (deployment.state === "READY") {
        const db = await dbPromise;
        const now = Date.now();
        await db.collection("deployments").updateOne(
          { id: deployment.uid },
          {
            $set: {
              id: deployment.uid,
              url: deployment.url,
              ownerId,
              auditing: now
            },
            $setOnInsert: {
              scores: null,
              report: null,
              lhError: null,
              createdAt: now
            }
          },
          { upsert: true }
        );
      }
    }

    let deployments;
    let next;

    if (projectId) {
      console.log(
        `fetching deployments of project: ${projectId}, from=${from || ""}`
      );
      ({ deployments } = await zeitClient.fetchAndThrow(
        `/v4/now/deployments?${stringify({
          from,
          limit: DEPLOYMENTS_LIMIT + 1,
          projectId
        })}`,
        {}
      ));
      if (deployments.length > DEPLOYMENTS_LIMIT) {
        deployments = deployments.slice(0, DEPLOYMENTS_LIMIT);
        next = deployments[deployments.length - 1].created - 1;
      }
    } else {
      console.log(`fetching projects: from=${from || ""}`);
      let projects = await zeitClient.fetchAndThrow(
        `/v1/projects/list?${stringify({
          from,
          limit: PROJECTS_LIMIT + 1
        })}`,
        {}
      );
      if (projects.length > PROJECTS_LIMIT) {
        projects = projects.slice(0, PROJECTS_LIMIT);
        next = projects[projects.length - 1].createdAt - 1;
      }

      console.log(`fetching deployments of projects`);
      const projectDeployments = await Promise.all(
        projects.map(p =>
          zeitClient.fetchAndThrow(
            `/v4/now/deployments?limit=1&projectId=${encodeURIComponent(p.id)}`,
            {}
          )
        )
      );
      deployments = projectDeployments
        .map((p, i) => ({ ...p.deployments[0], project: projects[i] }))
        .filter(d => Boolean(d.uid));
    }

    const deploymentIds = deployments
      .filter(d => d.state === "READY")
      .map(d => d.uid);

    console.log(`getting deployment docs`);
    const db = await dbPromise;
    const deploymentDocs = await db
      .collection("deployments")
      .find(
        {
          id: { $in: deploymentIds }
        },
        {
          projection: {
            id: 1,
            scores: 1,
            lhError: 1,
            auditing: 1
          }
        }
      )
      .toArray();

    const deploymentDocMap = new Map(deploymentDocs.map(d => [d.id, d]));
    const nextUrl = next ? `${installationUrl}?from=${next}` : null;
    const ownerSlug = team ? team.slug : user.username;

    return htm`
    <Page>
      <H1>Lighthouse scores of ${
        projectId ? "deployments in the project" : "your projects"
      }</H1>
      ${deployments.map(d => {
        const doc = deploymentDocMap.get(d.uid);
        const parsedUrl = parseDeploymentURL(d.url);
        const href = `https://${d.url}`;
        const deploymentHref = `/${encodeURIComponent(
          ownerSlug
        )}/${encodeURIComponent(parsedUrl.projectName)}/${encodeURIComponent(
          parsedUrl.id
        )}`;
        const projectHref = d.project
          ? `/${encodeURIComponent(ownerSlug)}/${encodeURIComponent(
              d.project.name
            )}/installation/${encodeURIComponent(slug)}`
          : null;
        const relativeTime = Date.now() - d.created;
        const ago = relativeTime > 0 ? `${ms(relativeTime)} ago` : "Just now";
        let contentView;
        let auditable = false;

        if (
          (doc && doc.auditing) ||
          (!doc && relativeTime < ASSUMED_AUDITING_TIME)
        ) {
          contentView = htm`<P>Auditing...</P>`;
        } else if (doc && doc.scores) {
          const { scores } = doc;
          const reportHref = `${HOST}/reports/${encodeURIComponent(d.url)}`;

          contentView = htm`
            <Link href=${reportHref} target="_blank">
              <Box display="flex" justifyContent="space-around" color="#000">
                <${Score} score=${scores.performance} title="Performance" />
                <${Score} score=${scores.accessibility} title="Accessibility" />
                <${Score} score=${
            scores["best-practices"]
          } title="Best Practices" />
                <${Score} score=${scores.seo} title="SEO" />
              </Box>
            </Link>
          `;
        } else if (doc && doc.lhError) {
          contentView = htm`<Box color="#c7221f">${doc.lhError}</Box>`;
          auditable = true;
        } else if (d.state !== "READY") {
          contentView = htm`<P>The deployment is not ready (<Box color="#bd10e0" display="inline">${
            d.state
          }</Box>)</P>`;
        } else {
          contentView = htm`<P>No report available</P>`;
          auditable = true;
        }

        const auditAction = auditable ? `audit:${d.uid}` : null;

        return htm`
          <Fieldset>
            <FsContent>
              ${
                d.project
                  ? htm`<H2><Link href=${projectHref}><Box color="#000">${
                      d.project.name
                    }</Box></Link></H2>`
                  : ""
              }
              <Box display="flex" justifyContent="space-between" marginBottom="10px">
                <Box display="flex" alignItems="center">
                  <Link href=${deploymentHref}><Box color="#000">${
          d.url
        }</Box></Link>
                  <Box marginLeft="10px" marginRight=="5px" marginBottom="-5px">
                    <Link href=${href} target="_blank"><Img src=${ASSETS_LINK_URL} height="13" width="13" /></Link>
                  </Box>
                </Box>
                <Box>${ago}</Box>
              </Box>
              ${contentView}
            </FsContent>
            ${
              auditAction
                ? htm`<FsFooter><Button action=${auditAction}>Run audits</Button></FsFooter>`
                : ""
            }
          </Fieldset>
        `;
      })}
      ${nextUrl ? htm`<Link href=${nextUrl}>View Next →</Link>` : ""}
    </Page>
  `;
  })
);
