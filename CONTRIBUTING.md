# Contributing

Thanks for taking the time to contribute! 🎉 This guide explains how to get the
project running locally and how changes make their way into a release.

By participating in this project you agree to abide by our
[Code of Conduct](CODE_OF_CONDUCT.md).

## Project layout

This is a [Yarn](https://yarnpkg.com) + [Lerna](https://lerna.js.org) monorepo.
The packages live under `packages/*`:

| Package        | Description                                                          |
| -------------- | ------------------------------------------------------------------- |
| `main-library` | The published npm package `json-as-xlsx`. **This is what ships.**    |
| `demo-express` | Runnable Express example (`ts-node`).                               |
| `demo-reactjs` | The web UI / demo site (built with Vite).                           |

## Requirements

Use the Node version pinned in [`.nvmrc`](.nvmrc) (currently **24.11.1**). If you
use [nvm](https://github.com/nvm-sh/nvm):

```shell
nvm use
```

Dependencies are managed with **Yarn Classic** (`yarn@1`). Install everything
from the repo root — workspaces are wired up automatically:

```shell
yarn install
```

## Develop locally

Start the library (watch mode) together with both demos:

```shell
yarn start
```

- Express demo: <http://localhost:5500>
- ReactJS demo: <http://localhost:6500>

## Testing

The Jest suite lives in `main-library`. Run it from the repo root:

```shell
yarn test
```

Please add or update tests when you change behavior.

## Building

```shell
yarn build   # Build main-library (tsc + uglify) and the demo-reactjs site
yarn static  # Copy the built demo-reactjs site into build/ for deploy
```

## Code style

This project uses [Prettier](https://prettier.io) for formatting — see
[`.prettierrc.json`](.prettierrc.json). Please format your code before opening a
pull request:

```shell
npx prettier --write .
```

## Submitting changes

1. Fork the repository and create your branch from `develop`.
2. Make your change, add tests, and make sure `yarn test` and `yarn build` pass.
3. Open a pull request against `main` describing what and why.

A maintainer reviews and merges the pull request. Merging to `main` runs the
release pipeline (tests, build, npm publish and GitHub release), so please keep
each pull request focused and green.

## Versioning

The released version lives in
[`packages/main-library/package.json`](packages/main-library/package.json) and
follows a custom **single-digit** scheme — each segment is one digit (`0`–`9`)
and **rolls over** instead of going to `10`:

- **Patch** by default: `2.5.7` → `2.5.8`.
- When the patch is already `.9`, bump the **minor** and reset the patch:
  `1.0.9` → `1.1.0`.
- When both minor and patch are `.9`, bump the **major** and reset both:
  `1.9.9` → `2.0.0`.

Maintainers bump the version as part of the pull request that goes into `main`.
