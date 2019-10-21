const { createComment } = require('../lib/comment')

const createOpts = (nScreenshots, nOthers, nDeleted) => {
  return {
    commitSha: '<commit_sha>',
    url: '<url>',
    screenshots: Array(nScreenshots)
      .fill()
      .map((_, i) => ({
        route: `<screenshot${i}_route>`,
        routeLink: `<screenshot${i}_route_link>`,
        thumbnailUrl: `<screenshot${i}_thumbnail_url>`,
        screenshotUrl: `<screenshot${i}_screenshot_url>`
      })),
    others: Array(nOthers)
      .fill()
      .map((_, i) => ({
        route: `<other${i}_route>`,
        routeLink: `<other${i}_route_link>`
      })),
    deleted: Array(nDeleted)
      .fill()
      .map((_, i) => `<deleted${i}_route>`)
  }
}

test.each([
  ['simple opts', createOpts(2, 2, 2)],
  ['only others', createOpts(0, 2, 0)],
  ['only screenshots', createOpts(2, 0, 0)],
  ['only deleted', createOpts(0, 0, 2)]
])('%s', (_, opts) => {
  expect(createComment(opts)).toMatchSnapshot()
})
