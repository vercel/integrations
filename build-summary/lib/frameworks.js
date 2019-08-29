const changeCase = require('change-case')

const fsRoutes = ({
  baseDir = '',
  fileExtension,
  filter,
  transform
}) => path => {
  // filter out files out of baseDir
  if (!path.startsWith(baseDir)) return false

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
      baseDir: 'pages/',
      filter: ['/_app', '/_document']
    })
  },
  {
    dependency: 'gatsby',
    routes: fsRoutes({ baseDir: 'src/pages/' })
  },
  {
    dependency: 'nuxt',
    routes: fsRoutes({ baseDir: 'pages/' })
  },
  {
    dependency: 'gridsome',
    routes: fsRoutes({
      baseDir: 'src/pages/',
      transform: route =>
        route
          .split('/')
          .map(changeCase.paramCase)
          .join('/')
    })
  },
  {
    dependency: 'sapper',
    routes: fsRoutes({ baseDir: 'src/routes/' })
  },
  {
    dependency: 'umi',
    routes: fsRoutes({ baseDir: 'src/routes/', filter: ['/document'] })
  }
]
