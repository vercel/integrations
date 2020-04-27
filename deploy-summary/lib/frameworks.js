const changeCase = require('change-case')

const fsRoutes = ({
  baseDirs = [''],
  fileExtension,
  filter,
  transform
}) => path => {
  // filter out files out of baseDir
  const baseDir = baseDirs.find(baseDir => path.startsWith(baseDir))

  if (!baseDir) return false

  // filter out wrong extension
  if (fileExtension && path.split('.').slice(-1)[0] !== fileExtension)
    return false

  path = path
    .slice(baseDir.length) // strip baseDir
    .replace(/\.[a-z]+$/, '') // strip .js, .ts, ...
    .replace(/\/?index$/i, '') // strip index

  path = `/${path}`

  if (typeof filter === 'function' && filter(path)) return false

  if (Array.isArray(filter) && filter.includes(path)) return false

  if (transform) {
    path = transform(path)
  }

  return path
}

module.exports = [
  {
    dependency: 'next',
    routes: fsRoutes({
      baseDirs: ['pages/', 'src/pages/'],
      filter: ['/_app', '/_document']
    }),
    shouldScreenshot: route => !route.startsWith('/api/')
  },
  {
    dependency: 'gatsby',
    routes: fsRoutes({ baseDirs: ['src/pages/'] })
  },
  {
    dependency: 'nuxt',
    routes: fsRoutes({ baseDirs: ['pages/'] })
  },
  {
    dependency: 'gridsome',
    routes: fsRoutes({
      baseDirs: ['src/pages/'],
      transform: route =>
        route
          .split('/')
          .map(changeCase.paramCase)
          .join('/')
    })
  },
  {
    dependency: 'sapper',
    routes: fsRoutes({ baseDirs: ['src/routes/'] })
  },
  {
    dependency: 'umi',
    routes: fsRoutes({ baseDirs: ['src/routes/'], filter: ['/document'] })
  }
]
