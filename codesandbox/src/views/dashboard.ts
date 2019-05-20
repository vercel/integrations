import { URL } from 'url';
import { htm } from '@zeit/integration-utils';
import { getDeployments } from '../lib/api';
import { getErrorById } from '../lib/utils';
import { ViewOptions, UIError } from '../types';
import { CREATE_SANDBOX, LOGOUT, newAction } from '../actions/utils';

const CODESANDBOX_URL = 'https://codesandbox.io';
const PATRON_URL = `${CODESANDBOX_URL}/patron`;

const hostname = (str: string) => {
  const url = new URL(str);
  return url.hostname;
};
const sandboxUrl = (id: string) => `${CODESANDBOX_URL}/s/${id}`;

const DeploymentBox = ({
  href,
  action,
  sandboxId,
  error
}: {
  href: string;
  action: string;
  sandboxId?: string;
  error?: UIError;
}) => htm`
  <Box
    display="grid"
    gridTemplateColumns="250px 220px 1fr"
    gridGap="10px"
    padding="10px"
    borderBottom="1px solid #eaeaea"
  >
    <Box wordBreak="break-word">
      <Link href=${href} target="_blank">${hostname(href)}</Link>
    </Box>
    <Box wordBreak="break-word">
      ${
        error
          ? htm`<Box color="#eb5757">${error.message}</Box>`
          : sandboxId
          ? htm`<Link href=${sandboxUrl(sandboxId)} target="_blank">${sandboxId}</Link>`
          : '-'
      }
    </Box>
    <Box>
      <Button small action=${action}>${sandboxId ? 'Recreate' : 'Create'} Sandbox</Button>
    </Box>
  </Box>
`;

export default async function dashboardView(viewOptions: ViewOptions) {
  const { payload, zeitClient } = viewOptions.options;
  const { sandboxes, user } = viewOptions.metadata;
  const { projectId } = payload;
  const deployments = await getDeployments(zeitClient, {
    query: { limit: 30, projectId }
  });
  const data = deployments.map(({ uid, url }) => ({
    id: uid,
    url: `https://${url}`,
    sandboxId: sandboxes[uid],
    error: getErrorById(viewOptions, uid)
  }));

  return htm`
    <Page>
			<ProjectSwitcher />
      <Box marginTop="10px" boxSizing="border-box" display="grid">
        <Box
          display="grid"
          gridTemplateColumns="250px 220px 1fr"
          gridGap="10px"
          padding="10px"
          border="1px solid #eaeaea"
          borderRadius="5px"
          background="rgb(250, 250, 250)"
          color="rgb(102, 102, 102)"
        >
          <Box>DEPLOYMENT</Box>
          <Box>SANDBOX</Box>
          <Box>ACTION</Box>
        </Box>
        ${data.map(
          d => htm`
            <${DeploymentBox}
              href=${d.url}
              action=${newAction(CREATE_SANDBOX, d.id)}
              sandboxId=${d.sandboxId}
              error=${d.error}
            />
          `
        )}
      </Box>
      <Fieldset>
        <FsContent>
          ${
            data.length
              ? htm`
                <P>🚨 <B>The created sandbox will be public</B>, you can make it private later in your CodeSandbox account if you're a <Link href=${PATRON_URL} target="_blank">Patron</Link> or remove it too</P>
              `
              : htm`<P>This project is empty 😮<P>`
          }
        </FsContent>
      </Fieldset>
      <Fieldset>
        <FsContent>
          <FsTitle>Account</FsTitle>
					<FsSubtitle>Logged in CodeSandbox as <B>${user.username}</B> - ${user.email}</FsSubtitle>
					<Button small action=${LOGOUT}>Logout</Button>
				</FsContent>
			</Fieldset>
		</Page>
  `;
}
