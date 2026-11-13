# Deployment runbook (Vercel)

Two Vercel projects are built from this one repository:

| | Souty PWA | Marketing site |
|---|---|---|
| Vercel project | The existing one, serving <https://souty.vercel.app> | A new one, created in [Part 2](#part-2-create-the-marketing-project) |
| Root Directory | `apps/pwa` | `apps/marketing` |
| Framework preset | Next.js | Next.js |
| Build, Install, Output settings | Defaults, no overrides | Defaults, no overrides |
| Node.js version | 22.x (matches `.nvmrc`) | 22.x |
| Environment variables | Two optional ones for the [vote store](#vote-store-pwa-project) | Three optional ones, [listed below](#environment-variables) |

> **Read this first.** The existing Vercel project builds from the
> repository root. After the monorepo restructure there is no Next.js app
> at the root any more, so the project **must** have its Root Directory set
> to `apps/pwa` **before** the monorepo branch is merged into `main`.
> Otherwise the next production deployment fails. [Part 1](#part-1-cut-the-existing-pwa-project-over)
> is the safe order to do it in.

**What this runbook could and could not verify.** The repository side
(scripts, paths, environment variables, ports) was checked against the
code. The Vercel side was written from Vercel's public documentation, not
from this project's dashboard, which the author could not see. Menu names
are given "at the time of writing" (November 2026) and may move. Each step
therefore states the **outcome to verify**; trust the outcome, not the
menu path.

## How Vercel builds this repository

Things to recognize in a build log:

- **Package manager.** Vercel detects pnpm from `pnpm-lock.yaml` at the
  repository root and installs the whole workspace from there, even though
  the project's Root Directory is a subfolder.
- **Shared packages.** Both apps import `@souty/brand` and
  `@souty/vocabulary` from `packages/`, outside their Root Directory. The
  option "Include source files outside of the Root Directory in the Build
  Step" (in the Root Directory section of the project settings) must be
  enabled. It is the default for projects created after August 2020.
- **Build command.** With no override, Vercel either runs `next build` in
  the Root Directory or, because it detects Turborepo, `turbo run build`
  scoped to that app. Both are fine for this repository.
- **Nothing is fetched at build time** except npm packages: the fonts, the
  model and the WASM runtime are all committed.

## Part 1: Cut the existing PWA project over

### Before you start

1. Locally, on the monorepo branch: `pnpm install`, then `pnpm build`. Both
   apps must build.
2. Open a pull request for the branch and wait for the CI check
   (`.github/workflows/ci.yml`) to pass.
3. Pick a quiet moment. Between step 3 and step 6 below, nothing else
   should be pushed to `main`.

### Steps

**Step 1. Push the branch. Do not merge it.**

**Step 2. Let Vercel build a preview of the branch.**
With the old settings this first preview is expected to **fail**
(typically "No Next.js version detected"), because the repository root no
longer contains the app. That is harmless: it is a preview, and production
is untouched. If it somehow succeeds, do not trust it; continue.

**Step 3. Change the Root Directory.**
In the Vercel dashboard, open the existing project, then Settings, then
Build and Deployment, then Root Directory. Enter `apps/pwa` and save.
While you are on that page, check:

| Setting | Expected value |
|---|---|
| Root Directory | `apps/pwa` |
| Include source files outside of the Root Directory in the Build Step | Enabled |
| Framework Preset | Next.js |
| Build Command, Output Directory, Install Command | No override (turn off any left over from the old layout, such as `npm run build` or `npm install`) |
| Node.js Version | 22.x |

The new Root Directory applies to the **next** deployment. Existing
deployments, including the one in production, do not change.

> **From now until the merge**, a deployment triggered from `main` would
> fail, because `main` still has the old layout and no `apps/pwa` folder.
> Production keeps running on the last successful deployment, but keep
> this window short.

**Step 4. Redeploy the preview.**
In Deployments, open the latest deployment of the branch and choose
Redeploy (or push a new commit to the branch).

Verify:

- the build is green;
- the log shows pnpm installing the workspace and Next.js building the app;
- the log's pnpm version is 10.x (if it is 9.x, see
  [Pinning pnpm exactly](#optional-pinning-pnpm-exactly)).

**Step 5. Test the preview on a real phone.**
Open the preview URL on a phone, over mobile data or Wi-Fi.

| Check | Expected |
|---|---|
| Camera | The browser asks for the camera; the live preview appears |
| Recognition | Hold an open palm: the ring fills and `عسلامة` is added within about a second |
| Sentence and voice | Lock two or three words, tap speak: the sentence is read aloud |
| Camera flip | Front and back cameras both work, the overlay stays on the hand |
| Install | "Add to Home screen" works and the app opens full screen |
| Offline | After the model has loaded once, turn on airplane mode, close the app and reopen it: the scanner still starts and recognizes signs |
| Look | Arabic text and headings use the same typefaces as production |

The full sign-by-sign checklist is [`apps/pwa/TESTING.md`](../apps/pwa/TESTING.md).

Two things that can surprise you on a preview URL:

- If the phone shows a Vercel login page, the project has Deployment
  Protection enabled for previews. Log in with your Vercel account on the
  phone.
- A preview URL is a different origin from `souty.vercel.app`. Its
  installed app and its offline cache are separate from production's.

**Step 6. Merge into `main`.**
Vercel builds the production deployment with the new Root Directory.
Watch it finish, then repeat the camera, recognition and offline checks on
<https://souty.vercel.app>.

Returning users are not asked to re-download the model: its URL and cache
key did not change in the restructure.

### If the production build fails

A failed build does **not** take the site down. Vercel keeps serving the
last successful production deployment. What you lose is the ability to
ship updates until the build is green again. Read the build log, fix
forward on a branch, and check the fix on a preview before merging.

### Rollback

| Situation | What to do |
|---|---|
| The new production deployment built, but the app is broken | Use **Instant Rollback**: on the project's overview page, on the production deployment tile, choose Instant Rollback and pick the previous deployment. The same action is in Deployments, in the menu of each row. It takes effect immediately and needs no rebuild. |
| You want to abandon the monorepo layout for now | First set Root Directory back to empty (the repository root) and restore any command overrides you removed. Then revert the merge commit on `main`. In that order, so the revert builds with the old settings. |

Notes on Instant Rollback, per Vercel's documentation at the time of
writing:

- On the Hobby plan you can roll back to the immediately previous
  production deployment only.
- After a rollback, Vercel stops assigning the production domain to new
  pushes. When the fix is ready, use **Undo Rollback** on the production
  tile (or promote the fixed deployment) to return to normal.
- Changing the Root Directory back does not by itself change what is live.
  Settings only affect the next deployment.

## Part 2: Create the marketing project

Do this **after** Part 1 is merged: `apps/marketing` must exist on `main`,
because a new project's first deployment is built from the production
branch.

**Step 1. Choose the name first.**
The project name becomes the default address, `<project-name>.vercel.app`,
if that name is free. This address goes into a printed QR code, so decide
it deliberately. If you plan to use a custom domain, add it in the
project's Domains settings before generating the QR code.

**Step 2. Import the same repository again.**
In the Vercel dashboard: Add New, Project, then import the same GitHub
repository. One repository can back several projects.

**Step 3. Configure the import.**

| Setting | Value |
|---|---|
| Project Name | The name chosen in step 1 |
| Root Directory | `apps/marketing` |
| Framework Preset | Next.js |
| Build Command, Output Directory, Install Command | Leave on their defaults |
| Environment Variables | See below; all optional |
| Node.js Version | 22.x, to match `.nvmrc`. If the import screen does not offer it, set it afterwards in Settings, Build and Deployment, and redeploy |

**Step 4. Deploy, then verify.**

| Check | Expected |
|---|---|
| Build | Green |
| `/` | Redirects to `/en`, `/fr` or `/ar` according to the browser's language |
| `/en`, `/fr`, `/ar` | Each renders; `/ar` is laid out right-to-left |
| Links to the app | Point at <https://souty.vercel.app> |
| Page source of `/en` | The canonical link uses the production address of the marketing site, not `localhost` |
| `/sitemap.xml` | Lists `/en`, `/fr` and `/ar` under the production address |
| An unknown path such as `/en/nope` | Shows the site's own "page does not exist" screen |

**Step 5. Generate the second QR code.** See
[below](#the-qr-code-for-the-marketing-site).

### Environment variables

Defined at the top of [`apps/marketing/lib/site.ts`](../apps/marketing/lib/site.ts).
All three are optional.

| Variable | Meaning | When unset |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin of the marketing site, for example `https://example.org`. Used for canonical, `hreflang` and Open Graph URLs, the sitemap, `robots.txt` and structured data. | Falls back to `https://` + `VERCEL_PROJECT_PRODUCTION_URL`, which Vercel provides automatically, then to `http://localhost:3001`. |
| `NEXT_PUBLIC_APP_URL` | Origin of the PWA the site links to. | `https://souty.vercel.app` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Address for partnership requests. | The "contact us" action is hidden. |

Rules:

- A trailing slash is stripped, so either form works.
- `NEXT_PUBLIC_` values are inlined at build time. After changing one,
  **redeploy**.
- On a plain `*.vercel.app` address you can leave `NEXT_PUBLIC_SITE_URL`
  unset. Once the site has its final or custom domain, set it explicitly
  for the Production environment: an explicit value is the reliable way to
  make every canonical URL follow a domain change.
- Set `NEXT_PUBLIC_CONTACT_EMAIL` only to a mailbox that someone reads.

### The QR code for the marketing site

Once the production address is final:

1. Add an entry for it to `tools/qr/codes.json`, after the existing
   `souty-app` entry and with the same four fields. Replace the two
   placeholders with the real address:

   ```json
   {
     "name": "souty-site",
     "url": "https://<marketing-address>",
     "caption": "<marketing-address>",
     "title": "Discover Souty"
   }
   ```

   `name` becomes the file name. `url` is exactly what the code encodes;
   use the bare origin (no `/en`), because the site picks the visitor's
   language itself. `title` and `caption` are the texts printed on the
   card version.
2. From the repository root, run `pnpm qr`.
3. The files appear in `docs/pitch/qr/` as `<name>.svg`, `<name>.png`,
   `<name>-card.svg` and `<name>-card.png`. The command also checks that
   each PNG decodes back to its URL.
4. Scan the printed or projected code with a phone before the pitch.
5. Commit `codes.json` and the generated files.

Details and options: [`tools/qr/README.md`](../tools/qr/README.md).

A printed QR code cannot be changed. If the address changes later, keep
the old one redirecting to the new one.

## Vote store (PWA project)

Community validation (`apps/pwa/SPEC.md`, FR-14) counts votes in a Redis
database reached over Upstash's REST API. Without it the PWA works as
before and simply hides the vote buttons and blue marks.

1. In the **PWA** project on Vercel: Storage → Create Database → Upstash
   → Redis (the free plan is enough), and connect it to the project for
   Production. This adds `KV_REST_API_URL`, `KV_REST_API_TOKEN` and
   `KV_REST_API_READ_ONLY_TOKEN` (used for counting, when present). Do
   not set a custom prefix: the route looks for these exact names.
   A database created directly on upstash.com works too: copy its REST
   URL and token into `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN`.
2. Redeploy, then open `https://<pwa-address>/api/votes`: it must answer
   `{"tallies":{}}`, not a 503.

The token is a server-side secret: never give it a `NEXT_PUBLIC_` name.
To reset a sign's votes, delete its two keys, `souty:votes:yes:<label>:<word>`
and `souty:votes:no:<label>:<word>`, in the Upstash console.

## Web Analytics

Both apps render Vercel's `<Analytics />` component. It only records data
when Web Analytics is enabled for that project in the Vercel dashboard
(the project's Analytics tab). It reports cookieless page views; what that
covers is described in [`apps/pwa/README.md`](../apps/pwa/README.md#privacy).
Enabling it, per project, is a deliberate decision: public statements about
privacy must match it.

## Optional: skipping builds that a commit does not affect

Every push triggers a deployment in both projects. Two ways to avoid
rebuilding an app that did not change:

1. **Built in.** Per Vercel's documentation at the time of writing, Vercel
   skips a project automatically when neither its folder nor its workspace
   dependencies changed. It needs a GitHub-connected repository, a
   workspace definition (`pnpm-workspace.yaml`), unique package names and
   explicit dependencies between packages, all of which this repository
   has. The switch is "Skip deployment", in the Root Directory section of
   each project's settings. Note that Vercel treats changes outside the
   workspace folders (for example in `docs/`) as global and rebuilds both
   projects.
2. **Explicit.** In each project's Settings, under Build and Deployment,
   set the Ignored Build Step to a custom command:

   ```bash
   npx turbo-ignore
   ```

   `turbo-ignore` asks Turborepo whether the app in the Root Directory, or
   any package it depends on, changed since the last deployment, and
   cancels the build if not. With it, a marketing-only change does not
   rebuild the PWA, and a docs-only change rebuilds nothing. Vercel's
   Turborepo guide lists the variant `npx turbo-ignore --fallback=HEAD^1`,
   which compares with the previous commit when there is no earlier
   deployment to compare with. Builds cancelled this way still count
   towards Vercel's deployment limits.

This is an optimization. Skip it until build minutes become a concern. If
you add it, check after the next two pushes that the right project was
skipped and the right one was built.

## Optional: pinning pnpm exactly

`packageManager` in the root `package.json` pins pnpm to an exact version
(`pnpm@10.18.3`). Locally and in CI that pin is honoured. On Vercel, by
default, the pnpm version is chosen from the lockfile format instead: a
`lockfileVersion: '9.0'` lockfile is installed with pnpm 9 or 10, and
Vercel's documentation says newer projects prefer 10 and older ones 9.
The build log shows which one ran.

This workspace expects pnpm 10 (the settings in `pnpm-workspace.yaml`).
To make Vercel use the exact pinned version, add this environment variable
to the project, for all environments, and redeploy:

```
ENABLE_EXPERIMENTAL_COREPACK=1
```

Vercel labels Corepack support experimental. It is optional: use it if the
build log shows an unexpected pnpm version, or if you want Vercel, CI and
laptops to run the identical pnpm.

## After every later change

| Change | What happens |
|---|---|
| Push to a branch | Each project builds a preview (unless skipped) |
| Merge to `main` | Each project builds and publishes production (unless skipped) |
| New model file | Follow "Changing the vocabulary" in [`TECHNICAL_DOC.md`](TECHNICAL_DOC.md): bump `MODEL_VERSION`, test by hand on a phone |
| Environment variable changed in Vercel | Redeploy the project; values are inlined at build time |
