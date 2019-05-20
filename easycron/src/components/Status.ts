import { htm as html } from '@zeit/integration-utils'

export const Status = ({ active }: { active: boolean }) => html`
  <Box
    display="inline-block"
    color="white"
    width="10px"
    height="10px"
    borderRadius="10px"
    marginLeft="5px"
    backgroundColor="${active ? 'rgb(80, 227, 194)' : 'red'}"
  />
`

export const Method = ({ children }: { children: any }) => html`
  <Box
    fontSize="11px"
    lineHeight="16px"
    fontWeight="bold"
    color="white"
    backgroundColor="black"
    padding="1px 5px 2px"
    borderRadius="3px"
    >${children}</Box
  >
`
