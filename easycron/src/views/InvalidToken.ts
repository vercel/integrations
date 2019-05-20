import { htm as html } from '@zeit/integration-utils'

export const InvalidToken = () => html`
  <Page>
    <Box
      width="100%"
      minHeight="300px"
      display="flex"
      alignItems="center"
      flexFlow="column"
      justifyContent="center"
      borderRadius="5px"
      borderColor="#eaeaea"
      borderStyle="solid"
      borderWidth="1px"
      marginTop="20px"
      marginBottom="20px"
    >
      <P>Your token is invalid! Please check it again <Link target="_blank" href="https://www.easycron.com/user/token">here.</Link></P>
      <Button small action="changeToken">
        Change API token
      </Button>
    </Box>
  </Page>
`
