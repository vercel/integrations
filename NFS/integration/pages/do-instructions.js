const { htm } = require('@zeit/integration-utils')

const URL = process.env.NOW_REGION
  ? 'https://nfs-integration.now.sh'
  : 'localhost:5005'

module.exports = htm`
<Container>
  <Box display="flex" justifyContent="right" flexDirection="column"  alignItems="right">
    <Container>
    <Box textAlign="center">
      <H1>Using Now.sh to access Digital Ocean Spaces</H1>
    </Box>
    </Container>
    <Container>
      <H2> 1) Preparing</H2>
      <P> Go to <Link href="https://www.digitalocean.com/">Digital Ocean</Link> and login. </P>
      <P> Click on the title "Spaces" on your dashboard. </P>
      <Img src=${`${URL}/assets/do1.png`} />
    </Container>
    <Container>
      <H2> 2) Creating a new Space</H2>
      <P> Access the new <Link href="https://cloud.digitalocean.com/spaces/new">space dashboard</Link>. Do not enable the Digital Ocean CDN we will be using <Link href="https://zeit.co/smart-cdn">Now CDN</Link>.</P>
      <Img src=${`${URL}/assets/do2.png`} />
      <P>Feel free to customize your Space as you like. Remember to save the <B>name</B>, <B>region</B> and <B>endpoint</B> of your fresh Space.</P>
    </Container>
    <Container>
      <H2> 3) Generating Access Key and Secret Key</H2>
      <P> Before using NFS, you must go to <Link href="https://cloud.digitalocean.com/account/api/tokens">Applications & API</Link>. There you will be able to generate a pair of keys</P>
      <Img src=${`${URL}/assets/do3.png`} />
      <P>Save those keys before proceeding.</P>
    </Container>
    <Container>
      <H2> 4) Launching NFS</H2>
      <P> Now you just need to use all the information that you've gathered so far.</P>
      <Img src=${`${URL}/assets/nfs-create.png`} />
      <P><B>Congratulations! You have created an integration between Now and Digital Ocean Spaces.</B></P>
    </Container>
  </Box>
  <Container>
  <Box display="flex" justifyContent="space-between">
      <Button action="menu">Go Back</Button>
      <Button action="rest-tutorial">NFS Instructions</Button>
  </Box>
  </Container>
</Container>
`
