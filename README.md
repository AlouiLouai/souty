# Souty (صوتي)

Souty ("my voice" in Tunisian Arabic) is a mobile-first web app for deaf and
hard-of-hearing people. Hold a hand sign up to the phone camera: the app
recognizes it, builds a sentence word by word, and speaks it aloud in
Tunisian Arabic (Derja). Recognition runs entirely on the device: no server,
no account, works offline as an installable PWA, and camera frames never
leave the phone.

Built for the Social Tech Challenge 2026.

## The two apps

| App | Package | Folder | Local dev | Deployed at |
|---|---|---|---|---|
| Souty PWA (the product) | `@souty/pwa` | [`apps/pwa`](apps/pwa) | `http://localhost:3000` | <https://souty.vercel.app> |
| Marketing site | `@souty/marketing` | [`apps/marketing`](apps/marketing) | `http://localhost:3001` | To be deployed, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) |

## Workspace map

This is a pnpm workspace orchestrated by Turborepo.

```
apps/
  pwa/                 The sign-to-speech PWA (Next.js, on-device MediaPipe model)
  marketing/           The marketing site (Next.js, English / French / Arabic)
packages/
  brand/               @souty/brand: design tokens, Tailwind preset, palette, self-hosted fonts
  vocabulary/          @souty/vocabulary: the 33 signs, single source of truth
  sign-model/          @souty/sign-model: runs the sign model in the browser (features, network, live decoding)
  tsconfig/            @souty/tsconfig: shared TypeScript bases
tools/
  qr/                  @souty/qr: generates and verifies the pitch QR codes
training/              The Kaggle training notebook and its README
docs/
  PITCH_DECK.md        Pitch deck content
  TECHNICAL_DOC.md     Architecture and model training pipeline
  DEPLOYMENT.md        Vercel runbook: two projects from this one repository
  reference/           "Souty pour tous.html", the design reference
  pitch/qr/            Generated QR codes
.github/workflows/     CI: lint, typecheck, test, build
```

Root files: `package.json` (scripts), `.gitattributes` (keeps vendored and model files byte-exact), `pnpm-workspace.yaml` (workspace globs
and the dependency catalog), `turbo.json` (task graph), `.nvmrc` (Node
version), `pnpm-lock.yaml`.

## Prerequisites

| Tool | Version | Source of truth |
|---|---|---|
| Node.js | 22 | [`.nvmrc`](.nvmrc) (`engines` allows `>=20.11`) |
| pnpm | 10.18.3 | `packageManager` in [`package.json`](package.json) |

Corepack ships with Node 22 and installs the pinned pnpm for you:

```bash
corepack enable
```

## Quick start

```bash
pnpm install
pnpm dev             # both apps: PWA on :3000, marketing on :3001
pnpm dev:pwa         # PWA only, http://localhost:3000
pnpm dev:marketing   # marketing site only, http://localhost:3001
```

The trained model and the MediaPipe WASM runtime are committed under
`apps/pwa/public/`, so there is no download step. To test the camera on a
physical phone you need HTTPS: see [`apps/pwa/README.md`](apps/pwa/README.md#run-it-locally).

## Common commands

Run these from the repository root.

| Command | What it does |
|---|---|
| `pnpm dev` | Starts both apps in watch mode |
| `pnpm dev:pwa` / `pnpm dev:marketing` | Starts one app |
| `pnpm build` | Production build of both apps |
| `pnpm lint` | ESLint in both apps |
| `pnpm typecheck` | `tsc --noEmit` in every package with TypeScript code (builds the apps first, because Next.js generates route types during the build) |
| `pnpm test` | Vitest, in the packages that have tests |
| `pnpm check` | `lint` + `typecheck` + `test` in one run |
| `pnpm qr` | Generates and verifies the pitch QR codes |

To run a script in one package only, filter by package name:

```bash
pnpm --filter @souty/pwa build
pnpm --filter @souty/vocabulary test
```

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs
`pnpm turbo run lint typecheck test build` on every pull request and on
every push to `main`.

## Shared packages

| Package | What it holds | Used by |
|---|---|---|
| `@souty/brand` | `tokens.css` (palette and semantic color roles), a Tailwind preset, palette constants for canvas and images, and the two typefaces (Readex Pro, Baloo Bhaijaan 2) loaded with `next/font/local` | both apps, `@souty/qr` |
| `@souty/vocabulary` | The 33 signs: model label, spoken word, English and French gloss, category, data source | both apps |
| `@souty/tsconfig` | `base.json`, `nextjs.json`, `library.json` | every package |

How they are consumed:

- **Source-only internal packages.** They have no build step. Their
  `exports` point straight at TypeScript and CSS source, and each app
  compiles them through `transpilePackages` in its `next.config.mjs`. Edit
  a package and both apps pick the change up on the next reload.
- **`workspace:*` links.** Apps depend on them as
  `"@souty/brand": "workspace:*"`.
- **One version of every shared dependency.** Versions of Next.js, React,
  Tailwind, TypeScript and the rest are declared once, in the `catalog`
  section of [`pnpm-workspace.yaml`](pnpm-workspace.yaml). Packages
  reference them as `"next": "catalog:"`, so the two apps cannot drift
  apart. To upgrade a dependency, change the catalog and run `pnpm install`.
- **Fonts are self-hosted.** The font files and their SIL Open Font
  Licences live in [`packages/brand/fonts`](packages/brand/fonts). Builds do
  not call Google Fonts, and the PWA can cache the fonts for offline use.
- **The vocabulary is pinned by a contract test.**
  `packages/vocabulary/src/index.test.ts` fixes the label to word mapping
  of the deployed model. A change there must come with a retrained model.

## Pitch QR codes

`pnpm qr` generates every code listed in `tools/qr/codes.json` into
[`docs/pitch/qr/`](docs/pitch/qr) as `<name>.svg`, `<name>.png`,
`<name>-card.svg` and `<name>-card.png`, then checks that each PNG decodes
back to its URL. The first entry, `souty-app`, points at
<https://souty.vercel.app>. The code for the marketing site is added once
that site has a URL ([`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)). Details:
[`tools/qr/README.md`](tools/qr/README.md).

## Documentation

| Document | Content |
|---|---|
| [`apps/pwa/README.md`](apps/pwa/README.md) | The PWA: problem, solution, features, how recognition works |
| [`apps/pwa/SPEC.md`](apps/pwa/SPEC.md) | Product and technical spec of the PWA |
| [`apps/pwa/TESTING.md`](apps/pwa/TESTING.md) | Manual test plan, mapped to the spec's requirements |
| [`apps/marketing/README.md`](apps/marketing/README.md) | The marketing site: structure, copy, locales |
| [`docs/TECHNICAL_DOC.md`](docs/TECHNICAL_DOC.md) | Architecture, model training pipeline, configuration |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Vercel runbook and the cutover to this monorepo layout |
| [`docs/PITCH_DECK.md`](docs/PITCH_DECK.md) | Pitch deck content |

## Training data and credits

The Tunisian Sign Language classes are trained on the
[Tunisian Sign Language Dataset](https://www.kaggle.com/datasets/warcoder/tunisian-sign-language-dataset)
(Chakroun & Jerbi, 2023, Mendeley Data, DOI `10.17632/fbjjgzgv7f.1`),
collected with **ATILS** (Tunisian Association of Sign Language
Interpreters) and licensed **CC BY 4.0**. The universal gesture classes come
from [HaGRID](https://github.com/hukenovs/hagrid). The training pipeline is
documented in [`docs/TECHNICAL_DOC.md`](docs/TECHNICAL_DOC.md).

The typefaces Readex Pro and Baloo Bhaijaan 2 are redistributed under the
SIL Open Font License; the licence texts are in
[`packages/brand/fonts`](packages/brand/fonts).

## Privacy

Camera frames are processed in memory on the device and are never
transmitted or stored. Recognition runs on the device, and sentences are
spoken by the browser's own speech synthesis. There are no accounts. Both
apps include Vercel Web Analytics, which reports cookieless page views to
Vercel; see
[`apps/pwa/README.md`](apps/pwa/README.md#privacy) for exactly what that
does and does not cover.

Team Souty, Meknassy (Sidi Bouzid), Tunisia.
