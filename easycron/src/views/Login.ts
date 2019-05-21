import { htm as html } from '@zeit/integration-utils'

export const Login = ({ apiToken }: { apiToken: string }) => html`
  <Page>
    <BR />
    <BR />
    <Box width="100%" display="flex" justifyContent="center">
      <Img src="https://easycron-integration.zeit.sh/static/logo.svg" />
    </Box>
    <BR />
    <BR />
    <Box width="100%" display="flex" justifyContent="center" >
      <Box maxWidth="500px">
        <Fieldset>
		    	<FsContent>
		    		<FsSubtitle>To get started please <Link target="_blank" href="https://www.easycron.com">create an account.</Link> After creating an account you can copy your <Link href="https://www.easycron.com/user/token">API token,</Link> which is used to connect to your <B>EasyCron</B> account.</FsSubtitle>
            <Input type="password" label="API token" name="apiToken" value=${apiToken} width="100%"  />
		    	</FsContent>
		    	<FsFooter>
            <Box width="100%" display="flex" justifyContent="flex-end">
              <Button small action="setToken">Connect</Button>
            </Box>
		    	</FsFooter>
		    </Fieldset>
      </Box>
    </Box>
  </Page>
`
