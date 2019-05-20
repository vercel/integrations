import { htm } from '@zeit/integration-utils';
import { ViewOptions } from '../types';
import { SETUP } from '../actions/utils';

const LOGIN_URL = 'https://codesandbox.io/cli/login';

export default function setupView({ errors }: ViewOptions) {
  const error = errors && errors.setupError;

  return htm`
    <Box>
			<Fieldset>
				<FsContent>
					<FsTitle>Login with your CodeSandbox account</FsTitle>
					<FsSubtitle>Go <Link href="${LOGIN_URL}" target="_blank">here</Link> to get an access token.</FsSubtitle>
					<Input width="280px" name="token" placeholder="token" />
				</FsContent>
			</Fieldset>
			${error ? htm`<Box color="red" marginBottom="20px">${error.message}</Box>` : ''}
			<Button action=${SETUP}>Setup</Button>
		</Box>
  `;
}
