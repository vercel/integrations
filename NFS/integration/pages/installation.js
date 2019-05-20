const { htm } = require('@zeit/integration-utils')

const model = require('../models/install.js')
const { deploy } = require('../lib/ZEIT.js')

const { saveDeployment } = require('../lib/meta.js')

const data = {
}

const getInputElements = () =>
  Object.keys(model).map(key => htm`
    <Container>
      <Input label=${model[key].title} name="${key}_name" value=''/>
    </Container>
  `)

const allRequiredFieldsPresent = () =>
  Object.keys(model).reduce((acc, key) =>
    !(!data[key] && model[key].required) && acc, true)

const requiredErroredFields = () =>
  Object.keys(model).map(key =>
    (!data[key] && model[key].required)
      ? htm`
        <Container>
          <Input label=${model[key].title} name=${key} value='' errored/>
        </Container>`
      : htm`
        <Container>
          <Input label=${model[key].title} name=${key} value=${data[key]}/>
        </Container>`
  )

module.exports = async (ctx, { access_token: token }) => {
  const { clientState, action } = ctx.payload

  switch (action) {
    case 'submit':
      Object.keys(model).map(key => {
        data[key] = clientState[key]
      })

      if (allRequiredFieldsPresent()) {
        const result = await deploy(data, token)
        if (result.code) {
          return htm`
          <Box display="flex" justifyContent="space-between">
            <Notice type="error">${result.message}</Notice>
            <Button action="reset">Go Back</Button>
          </Box>
        `
        }

        const deployment = {
          id: result.id,
          bucket_name: clientState.bucket_name,
          region: clientState.region,
          endpoint: clientState.endpoint,
          alias: result.aliasFinal ? result.aliasFinal[0] : clientState.alias,
          created_at: new Date()
        }

        await saveDeployment(ctx, deployment)
        return htm`
        ${requiredErroredFields()}
          <Container>
            <Notice type="success">Deployed Successfully!</Notice>
          </Container>
          <AutoRefresh timeout="3000" />
        `
      }

      return htm`
      <Box>
      <Fieldset>
        <FsContent>
          <FsTitle>Create new Now File Storage</FsTitle>
          <FsSubtitle>This will allow you to create a new deployment that can upload and download files to your bucket</FsSubtitle>
          ${requiredErroredFields()}
        </FsContent>
        <FsFooter>
          <Box display="flex" justifyContent="space-between">
            <Button action="submit">Submit</Button>
          </Box>
        </FsFooter>
      </Fieldset>
      </Box>
      `
    case 'reset':
      Object.keys(model).map(key => {
        clientState[key] = ''
      })
      return htm`
        <Box display="flex" justifyContent="right" flexDirection="column"  alignItems="right">
        <Fieldset>
          <FsContent>
            <FsTitle>Create new Now File Storage</FsTitle>
            <FsSubtitle>This will allow you to create a new deployment that can upload and download files to your bucket</FsSubtitle>
            ${getInputElements()}
          </FsContent>
          <FsFooter>
            <Box display="flex" justifyContent="space-between">
              <Button action="submit">Submit</Button>
            </Box>
          </FsFooter>
        </Fieldset>
        </Box>
        `
    default:
      return htm`
        <Box display="flex" justifyContent="right" flexDirection="column"  alignItems="right">
        <Fieldset>
          <FsContent>
            <FsTitle>Create new Now File Storage</FsTitle>
            <FsSubtitle>This will allow you to create a new deployment that can upload and download files to your bucket</FsSubtitle>
            ${getInputElements()}
          </FsContent>
          <FsFooter>

          <Box display="flex" justifyContent="space-between">
            <Button action="submit">Submit</Button>
          </Box>
          </FsFooter>
        </Fieldset>
        </Box>
        `
  }
}
