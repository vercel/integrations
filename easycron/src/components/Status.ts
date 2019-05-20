import { htm as html } from "@zeit/integration-utils";

export const Status = ({ active }: { active: boolean }) => html`
  <Box display="inline-block" color="white" width="10px" height="10px" borderRadius="10px" backgroundColor="${active ? 'rgb(80, 227, 194)' : 'red'}" />
`