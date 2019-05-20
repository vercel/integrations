# CodeSandbox Integration

This integration allows the source code of Now deployments to be added to a sandbox from [CodeSandbox](https://codesandbox.io), the app can then be opened in their online editor for code sharing / development and more.

## Getting Started

Clone the repo and install packages, then run:

```bash
now dev
```

if `now dev` is having issues:

```bash
yarn start
```

## Deployment

```bash
now --target=production
```

## Limitations

All projects are subject to CodeSandbox limitations for public sandboxes, those include:

- 120 maximum modules
- 50 maximum directories
- 5mb maximum size for media/binary files
