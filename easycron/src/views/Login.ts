import { htm as html } from '@zeit/integration-utils'

export const Login = ({ apiToken }: { apiToken: string }) => html`
  <Page>
    <BR />
    <BR />
    <Box width="100%" display="flex" justifyContent="center">
      <Img src="https://easycron-integration.huv1k.now.sh/static/logo.svg" />
    </Box>
    <BR />
    <BR />
    <Fieldset>
			<FsContent>
					<FsTitle>API token</FsTitle>
					<FsSubtitle>To get started please <Link target="_blank" href="https://www.easycron.com">create a account</Link> and go to <Link href="https://www.easycron.com/user/token">API in menu.</Link> Where you can copy <B>token</B> and connect to your <B>EasyCron</B> account.</FsSubtitle>
          <Input type="password" label="API token" name="apiToken" value=${apiToken}  />
				</FsContent>
				<FsFooter>
          <Box width="100%" display="flex" justifyContent="flex-end">
            <Button small action="setToken">Connect</Button>
          </Box>
				</FsFooter>
			</Fieldset>
  </Page>
`
