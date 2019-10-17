const { MAX_WIDTH } = require('./constants')

const ellipsis = (txt, l = 25) => {
  return txt.length > l ? `…${txt.slice(-22)}` : txt
}

const escapeLinkTitle = txt => {
  // escape [ and ] with \
  return txt.replace(/\[/g, '\\[').replace(/\]/g, '\\]')
}

const createComment = ({
  commitSha,
  url,
  screenshots,
  otherRoutes = [],
  deletedRoutes = []
}) => {
  // group by screenshots by 3
  const grouped = screenshots.reduce((pv, cv, i) => {
    const j = Math.floor(i / 2)
    ;(pv[j] || (pv[j] = [])).push(cv)
    return pv
  }, [])

  return `#### 📝Changed routes:
${grouped
  .map(
    group => `

|${group
      .map(
        ({ routeLink, route }) =>
          ` [**${escapeLinkTitle(ellipsis(route))}**](${routeLink}) |`
      )
      .join('')}
|${':-:|'.repeat(group.length)}
|${group
      .map(
        ({ routeLink, route, thumbnailUrl, screenshotUrl }) =>
          `<a href="${routeLink}"><img src="${thumbnailUrl}" alt="Screenshot of ${route}" width="${MAX_WIDTH}"></a>` +
          '<br />' +
          `<sup><a href="${screenshotUrl}">(view full size)</a>` +
          ' |'
      )
      .join('')}

`
  )
  .join('')}

${
  otherRoutes.length > 0
    ? `And ${otherRoutes.length} other route${
        otherRoutes.length === 1 ? '' : 's'
      }:
${otherRoutes
  .map(
    ({ route, routeLink }) => `- [**${escapeLinkTitle(route)}**](${routeLink})`
  )
  .join('\n')}`
    : ''
}

${
  deletedRoutes.length > 0
    ? `And ${deletedRoutes.length} deleted route${
        deletedRoutes.length === 1 ? '' : 's'
      }:
${deletedRoutes.map(route => `- **${route}**`).join('\n')}`
    : ''
}

Commit ${commitSha} (${url}).`
}

module.exports = { createComment }
