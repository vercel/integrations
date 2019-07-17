function inputBuilder(input, index) {
  switch (input.type) {
    case 'input':
      return `<Box flex="1">
        <B>${input.label}</B><BR/><Input width="100%" placeholder="an input"/>
      </Box>`
    case 'textarea':
      return `<Box flex="1">
        <B>${input.label}</B><BR/><Box borderRadius="5px" background="white"><Textarea width="100%" placeholder="a textarea"/></Box>
      </Box>`
    case 'checkbox':
      return `<Box flex="1">
        <Checkbox label="${input.label}" checked="false" />
      </Box>`
  }
  return ''
}
module.exports = function formBuilder(inputs, newType, newLabel) {
  return `
    ${inputs.map((input, index) => `
      <Box display="flex" alignItems="center" marginTop="20px">
        ${inputBuilder(input, index)}
        <Box marginLeft="10px" marginTop="18px">
          <Link action="remove-${index}" color="red">remove</Link>
        </Box>
      </Box>
    `).join('')}
    <Box display="flex" justifyContent="flex-start" alignItems="center" marginTop="20px" marginBottom="20px">
      <P/>
      <P>Add new</P>
      <Box marginLeft="10px" marginRight="10px">
        <Select name="newType" value="${newType}">
          <Option value="input" caption="Input" />
          <Option value="textarea" caption="Textarea" />
          <Option value="checkbox" caption="Checkbox" />
        </Select>
      </Box>
      <P>with field name</P>
      <Box marginLeft="10px">
        <Input name="newLabel" value="${newLabel}" placeholder="Untitled Field" />
      </Box>
      <Box marginLeft="10px">
        <Link action="add">add</Link>
      </Box>
    </Box>
    <Box background="#eaeaea" height="1px" marginTop="20px" marginBottom="20px" />
  `
}
