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
  screenshots = [],
  others = [],
  deleted = []
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
  others.length > 0
    ? `${
        screenshots.length > 0
          ? `And ${others.length} other route${others.length === 1 ? '' : 's'}:`
          : ''
      }
${others
  .map(
    ({ route, routeLink }) => `- [**${escapeLinkTitle(route)}**](${routeLink})`
  )
  .join('\n')}`
    : ''
}

${
  deleted.length > 0
    ? `${deleted.length} deleted route${deleted.length === 1 ? '' : 's'}:
${deleted.map(route => `- **${route}**`).join('\n')}`
    : ''
}

Commit ${commitSha} (${url}).`
}

module.exports = { createComment }
