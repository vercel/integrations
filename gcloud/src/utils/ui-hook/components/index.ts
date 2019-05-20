import { htm as html } from '@zeit/integration-utils'

const { BASE_URL } = process.env

export const VerticalBox = ({ children }: any): string => html`
  <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" textAlign="center">
    ${children}
  </Box>
`

const StatusDotStyle = {
  width: '10px',
  height: '10px',
  borderRadius: '6px',
  marginRight: '5px'
}

interface Props {
  color: 'green' | 'yellow' | 'red';
  title?: string;
  marginTop?: string;
}

export const StatusDot = ({ color: color_, title, marginTop = '0px' }: Props): string => {
  let color = '#ccc'

  if (color_ === 'green') {
    color = '#1EDA9A'
  }
  if (color_ === 'yellow') {
    color = '#f7cd54'
  }
  if (color_ === 'red') {
    color = '#DA2929'
  }

  const style = {
    ...StatusDotStyle,
    marginTop
  }

  return html`
    <Box ...${style} backgroundColor=${color} title=${title || color} />
  `
}

export const Note = ({ children, type, color}: any): string => html`
  <BR />
  <Box padding="10px" border=${`1px solid ${color ? color : type === 'error' ? '#F5A623' : '#0076FF'}`} borderRadius="5px">
    ${children}
  </Box>
  <BR />
`

export const Divider = ({ text }: any): string => html`
  <BR />
  <Box display="flex" alignItems="center" justifyContent="center">
    <Img src=${`${BASE_URL}/static/line.svg`} />
    <Box marginLeft="20px" marginRight="20px">
      <P>${text}</P>
    </Box>
    <Img src=${`${BASE_URL}/static/line.svg`} />
  </Box>
  <BR />
`
