# Repository guidance for AI assistants

Guidance for AI coding assistants (e.g. Claude Code) when working in this repository.

## Mandatory Synchronization

- `AGENTS.md` and `CLAUDE.md` must say exactly the same thing.
- If an assistant modifies one of these files, it must apply the same change to the other in the same task.
- After editing them, verify from the repository root with `cmp -s AGENTS.md CLAUDE.md`.
- Do not leave instructions, notes, preferences, or knowledge updates only in one of the two files.

## Project

`json-as-xlsx` — a Yarn + Lerna monorepo. Packages live in `packages/*`:

- `main-library` — the published npm package `json-as-xlsx` (this is what gets released).
- `demo-express` — runnable Express example (`ts-node`, started with `yarn start`).
- `demo-reactjs` — the web UI / demo site (built with Vite).

Validation commands (run from the repo root):

- `yarn test` — runs the library Jest suite.
- `yarn build` — builds `main-library` (tsc + uglify) and `demo-reactjs`.
- `yarn static` — copies the built `demo-reactjs` site into `build/` for deploy.

Use the Node version in `.nvmrc` (currently `24.11.1`). Cloudflare reads `.nvmrc`,
so it must stay on a version supported by the toolchain (lerna 9 needs
`^20.19 || ^22.12 || >=24`).

## Demo parity — IMPORTANT

`demo-reactjs` (the web UI) and `demo-express` (the API) are two views of the
same library and **must demonstrate the same features**. Whenever you add or
change an example in one, make the equivalent change in the other in the same
task:

- If you add an example/download to the UI
  (`packages/demo-reactjs/src/App.tsx`), add the matching endpoint to the API
  (`packages/demo-express/src/server.ts`) — and the other way around.
- Keep the demonstrated data and styling equivalent so the two stay in sync.

## Demo dependency workflow — IMPORTANT

- The demo packages are Yarn workspaces and are expected to be installed and run
  from the repository root, not as standalone packages from inside
  `packages/demo-*`.
- Keep the demos' `json-as-xlsx` dependency pinned to the `main-library` package
  version being prepared for release. From the repo root, Yarn resolves that
  dependency to the local `packages/main-library` workspace.
- Do **not** switch the demo dependencies back to `file:../main-library` just to
  support standalone installs before the version is published to npm. That can
  create stale local path installs or nested package copies, and makes the demos
  less clearly reflect the release candidate. Only change this if Luis
  explicitly asks to support standalone demo installs.

## Backward compatibility — IMPORTANT

`json-as-xlsx` is a published library that other people depend on. **The
`main-library` public API MUST stay backward-compatible** so that existing
users' code keeps working when they upgrade:

- **Never remove or rename** an exported function, type, option, or parameter,
  and never change the meaning, default value, or return type of an existing
  one.
- **Add, don't change.** New behavior must be opt-in (e.g. a new optional
  setting) with defaults that preserve the current behavior.
- This covers everything exported from `packages/main-library/src/index.ts`
  (e.g. `xlsx`, `IJsonSheet`, `ISettings`, `IColumn`, the `utils` re-export) and
  the accepted shape of the `data` / `settings` objects.
- **If a change would be breaking, STOP — do NOT make it. Tell Luis first**,
  explain exactly what would break and why, and wait for his explicit approval.
  Breaking changes are only allowed with his go-ahead (and a major version bump).

## Branch workflow — IMPORTANT

- **Never create new branches.** All work happens on `develop`. The AI must not
  create feature/topic branches — commit to `develop` and push it.
- **Pushing `develop` is always safe — do it freely, no confirmation needed.**
  It only triggers a Cloudflare deploy to the dev environment, which is Luis's
  internal/staging site. Nothing is published to npm or end users from `develop`.
- **`main` is push-protected: you CANNOT push to it from local.** Whenever you
  find yourself on `main`, switch to `develop` and do the work there.
- **When moving to `develop`, first bring in the latest changes from `main`**
  (e.g. `git switch develop && git merge origin/main`) so we never start from
  outdated code. Then make changes, commit, and push `develop`.
- Changes reach `main` via Pull Request (develop → main), since direct pushes
  to `main` are blocked.
- **When Luis asks to "make a PR" (or "open the PR") and we are on `develop`,
  it is ALWAYS a PR from `develop` into `main`.** Don't ask which base branch —
  the target is always `main`.
- **The AI may, at most, open the Pull Request (develop → main). It must never
  merge it** — Luis reviews and merges the PR himself.

## Commit workflow — IMPORTANT

- When the AI makes a commit, it must include **all pending worktree changes**:
  tracked modifications, deletions, and new files. Do not leave local changes
  uncommitted unless Luis explicitly asks to exclude something.

## Pull request review comments — IMPORTANT

Whenever GitHub Copilot (or any reviewer) leaves review comments on a PR, handle
every comment the same way:

- **Evaluate, then fix what applies.** Decide whether each comment is valid. Fix
  the ones that are (add a test when it's a behavior change). For anything you
  intentionally don't change, that's fine — just explain why.
- **Reply on the thread tagging `@copilot`**, briefly stating what you did (or
  why you didn't) and referencing the commit that addresses it.
- **Resolve the conversation** once it's handled.

Notes: resolving threads needs the GraphQL API (REST can't) — list the PR's
`reviewThreads` to get each thread id, then call the `resolveReviewThread`
mutation. After pushing the fixes, re-request Copilot's review so it runs again.

## Posting GitHub comments — IMPORTANT

When posting issue/PR comments whose body contains Markdown (code blocks,
mentions, multiple lines), the only real gotcha is this: **`--body` takes its
value literally — it does NOT read stdin and does NOT interpret `@file`/`@-`.**
So `--body @-` posts the literal string `@-`. Pick one of the forms below.

- When replying to a specific person in a GitHub issue or PR comment, tag them
  by GitHub username (e.g. `@username`) so the reply is clearly directed to
  them.
- **Inline via command substitution is fine** (a multi-line heredoc works
  perfectly — we use it for PR bodies):
  `gh pr comment <num> --repo <owner/repo> --body "$(cat <<'EOF' … EOF)"`
- **From a file or stdin** with `--body-file`:
  - Issue: `gh issue comment <num> --repo <owner/repo> --body-file <file>`
  - PR: `gh pr comment <num> --repo <owner/repo> --body-file <file>`
  - `--body-file -` reads from stdin (e.g. a heredoc).
- To **edit** an existing comment, PATCH it via the API (the numeric
  `comment_id` is the `issuecomment-<id>` suffix in the comment URL). To read the
  body from a file use `-F body=@<file>`, but note `-F` coerces types — a file
  whose entire content is `true`/`false`/`null`/a number becomes that type
  instead of a string. The fully safe form is to pass the string directly:
  `gh api -X PATCH repos/<owner/repo>/issues/comments/<comment_id> -f body="$(cat <file>)"`.
- After posting, verify the rendered body (e.g.
  `gh api repos/<owner/repo>/issues/comments/<id> --jq .body`) instead of
  assuming it worked.

## Versioning — IMPORTANT

The released version lives in `packages/main-library/package.json`. When asked to
"bump the version" (subir versión), follow these rules — **each segment is a single
digit (0–9) and rolls over instead of going to 10**:

- **Default: bump the patch.** e.g. `2.5.7` → `2.5.8`.
- **When the patch is already `.9`, bump the minor and reset the patch to 0.**
  e.g. `1.0.9` → `1.1.0` (never `1.0.10`).
- **When both the minor and the patch are `.9`, bump the major and reset both to 0.**
  e.g. `1.9.9` → `2.0.0` (never `1.9.10` or `1.10.0`).

## Deploys — who deploys what

- **`develop` → Cloudflare Pages.** Pushing `develop` builds and deploys the
  web UI (`demo-reactjs`) to Cloudflare (`develop` is the Cloudflare production
  branch; build command `yarn build && yarn static`, output `build`). Live at
  **https://xlsx.luismarroquin.com** / **https://xlsx.pages.dev**. Other
  branches get Cloudflare *preview* deployments.
- **`main` → GitHub Actions.** Pushing/merging to `main` runs `.github/workflows/main.yml`,
  which tests, builds, **publishes the package to npm**, creates a GitHub release,
  and deploys the UI to GitHub Pages at **https://xlsx.marroquin.dev** (the
  `gh-pages` branch). The npm version comes from
  `packages/main-library/package.json`, so bump it before merging to `main`.
