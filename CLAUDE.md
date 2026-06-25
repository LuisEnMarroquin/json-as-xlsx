# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

`json-as-xlsx` — a Yarn + Lerna monorepo. Packages live in `packages/*`:

- `main-library` — the published npm package `json-as-xlsx` (this is what gets released).
- `demo-express` — runnable Express example (`ts-node`, started with `yarn start`).
- `demo-reactjs` — the web UI / demo site (built with `react-scripts`).

Validation commands (run from the repo root):

- `yarn test` — runs the library Jest suite.
- `yarn build` — builds `main-library` (tsc + uglify) and `demo-reactjs`.
- `yarn static` — copies the built `demo-reactjs` site into `build/` for deploy.

Use the Node version in `.nvmrc` (currently `22.16.0`). Cloudflare reads `.nvmrc`,
so it must stay on a version supported by the toolchain (lerna 9 needs
`^20.19 || ^22.12 || >=24`).

## Branch workflow — IMPORTANT

- **`main` is push-protected: you CANNOT push to it from local.** Whenever you
  find yourself on `main`, switch to `develop` and do the work there.
- **When moving to `develop`, first bring in the latest changes from `main`**
  (e.g. `git switch develop && git merge origin/main`) so we never start from
  outdated code. Then make changes, commit, and push `develop`.
- Changes reach `main` via Pull Request (develop → main), since direct pushes
  to `main` are blocked.

## Deploys — who deploys what

- **`develop` → Cloudflare Pages.** Pushing `develop` builds and deploys the
  web UI (`demo-reactjs`) to Cloudflare (`develop` is the Cloudflare production
  branch; build command `yarn build && yarn static`, output `build`). Other
  branches get Cloudflare *preview* deployments.
- **`main` → GitHub Actions.** Pushing/merging to `main` runs `.github/workflows/main.yml`,
  which tests, builds, **publishes the package to npm**, creates a GitHub release,
  and deploys to `gh-pages`. The npm version comes from
  `packages/main-library/package.json`, so bump it before merging to `main`.
