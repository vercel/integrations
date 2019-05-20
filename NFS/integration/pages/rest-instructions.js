const { htm } = require('@zeit/integration-utils')

const URL = process.env.NOW_REGION
  ? 'https://nfs-integration.now.sh'
  : 'localhost:5005'

const jsonUpload = {
  'url': 'https://sfo2.digitaloceanspaces.com/myspace',
  'fields': {
    'key': 'a1b2c3',
    'bucket': 'now2-spaces',
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': 'CREDENTIAL',
    'X-Amz-Date': '20190513T162331Z',
    'Policy': 'THISISAPOLICE',
    'X-Amz-Signature': 'THISISASIGNATURE'
  },
  'Content-Type': 'image/png',
  'acl': 'private'
}

const curlUpload = `
curl --request POST
  --url https://sfo2.digitaloceanspaces.com/myspace
  --header 'content-type: multipart/form-data;'
  --form key=a1b2c3
  --form acl=private
  --form Content-Type=image/png
  --form X-Amz-Credential=CREDENTIAL
  --form X-Amz-Algorithm=AWS4-HMAC-SHA256
  --form X-Amz-Date=20190513T162331Z
  --form Policy=THISISAPOLICE
  --form X-Amz-Signature=THISISASIGNATURE
  --form file=
`

module.exports = htm`
<Container>
  <Box display="flex" justifyContent="right" flexDirection="column"  alignItems="right">
    <Container>
    <Box textAlign="center">
      <H1 >Using NFS</H1>
    </Box>
    </Container>
    <Container>
      <H2> 1) Introduction</H2>
      <P> In this example we will be showing how to use a deployment
      created by NFS to upload and receive files.</P>
      <P> We recommend the use of a REST Client, like <Link href="https://insomnia.rest/">Insomnia</Link> or <Link href="https://www.getpostman.com/">Postman</Link>. </P>
    </Container>
    <Container>
      <H2> 2) Requesting a signed upload</H2>
      <P> The firs REST route that NFS allows you to use is: <Code value="${encodeURIComponent('curl -X POST "https://myalias.now.sh" -d "{ "filename": "zeit.png" }"')}" /></P>

      <P>It should generate a JSON response very similar to:</P>

      <P><Code value="${encodeURIComponent(JSON.stringify(jsonUpload, null, 2))}" /></P>
    </Container>
    <Container>
      <H2> 3) Using the signed Object</H2>
      <P> With that object saved, you will need to create a new request like the following:</P>

      <P><Code value="${encodeURIComponent(curlUpload)}" /></P>

      <P>Notice that you only need to re-use the object given on step <B>2)</B>.
     Tha request allows you to send the file directly to your storage provider,
     saving costs and bandwith while delivering a good performance. A response of 2XX will be returned if your request was successful.
      </P>
    </Container>
    <Container>
      <H2> 4) Retrieving the file</H2>
      <P> To recover your file, use the response in <B>2)</B>:</P>

      <P><Code value="${encodeURIComponent('GET /a1b2c3')}" /></P>

      <P>If you take a closer look to your headers, you will observe this file is cached by <Link href="https://zeit.co/smart-cdn"> ZEIT's Smart CDN</Link>, allowing fast delivery times at every location around the globe.
      </P>
    </Container>
  </Box>
  <Container>
  <Box display="flex" justifyContent="space-between">
      <Button action="menu">Go Back</Button>
  </Box>
  </Container>
</Container>
`
