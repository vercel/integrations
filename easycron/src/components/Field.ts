import { htm as html } from '@zeit/integration-utils'

export const Field = ({
  title,
  children,
  footer,
}: {
  title: string
  children: any
  footer: any
}) => html`
  <Fieldset>
    <FsContent>
      <FsTitle><B>${title}</B></FsTitle>
      ${children}
    </FsContent>
    ${footer ? html`
      <FsFooter>
        ${footer}
      </FsFooter>` : ''}
  </Fieldset>
`
