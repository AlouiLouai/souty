# Souty marketing site

Package `@souty/marketing` in the [Souty monorepo](../../README.md). A
one-page Next.js site that tells the Souty story in order: the problem,
the idea, what is built today, proof, the roadmap, the vision, and a call
to try the app. It is written in English, French and Arabic.

The product itself is the PWA in [`apps/pwa`](../pwa), live at
<https://souty.vercel.app>. This site is not deployed yet; the runbook is
[`docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md).

## Commands

From the repository root:

| Command | What it does |
|---|---|
| `pnpm dev:marketing` | Dev server on `http://localhost:3001` |
| `pnpm --filter @souty/marketing build` | Production build |
| `pnpm --filter @souty/marketing start` | Serves the production build on port 3001 |
| `pnpm --filter @souty/marketing lint` | ESLint |
| `pnpm --filter @souty/marketing test` | Vitest (locale negotiation) |
| `pnpm turbo run typecheck --filter=@souty/marketing` | Builds, then runs `tsc --noEmit` |

## Structure

Paths are relative to `apps/marketing/`.

```
app/
  [locale]/            The page, its layout (metadata, <html lang dir>), the localized 404,
                       the social sharing image, and a catch-all for unknown paths
  globals.css          Base styles; colors and fonts come from @souty/brand
  sitemap.ts, robots.ts
middleware.ts          Redirects un-prefixed requests to a locale
i18n/
  config.ts            The locale list, text direction, labels, BCP 47 tags, cookie name
  negotiate.ts         Accept-Language negotiation and path helpers (tested)
content/
  en/                  English copy, one file per section, assembled in en/index.ts
  fr/, ar/             Translations, each exporting an object of type Dictionary
  index.ts             The Dictionary type, getDictionary(locale), format()
  shared.ts            Types for non-translatable values inside dictionaries
components/
  ui/                  Primitives: Button, Card, Container, Section, SectionHeading, Reveal...
  sections/            One component per page section, in page order
  site/                Header, footer, language switcher, structured data
  <feature>/           Building blocks of one section (product/, roadmap/, vision/, demo/...)
lib/
  site.ts              Site constants, environment variables, section anchor ids
public/                Icons and the logo mark
```

Conventions:

- **Routes carry the locale**: `/en`, `/fr`, `/ar`. All three are
  prerendered. A request without a prefix is redirected by
  `middleware.ts` to the visitor's saved choice (cookie `souty_locale`,
  set by the language switcher) or to the best match for the browser's
  `Accept-Language` header. English is the default.
- **Arabic is right-to-left.** The layout sets `dir` from
  `i18n/config.ts`. Use logical CSS utilities (`ms-*`, `me-*`, `text-start`)
  rather than left/right ones.
- **No copy in components.** `app/[locale]/page.tsx` loads the dictionary
  and passes `{ dict, locale }` to every section (`SectionProps` in
  `components/sections/types.ts`). Components read strings from `dict`.
- **Sections are built from `components/ui` primitives** and take their
  anchor ids from `sectionIds` in `lib/site.ts`, so the header links and
  the sections cannot drift apart.
- **Brand comes from the workspace.** Colors, semantic tokens, the Tailwind
  preset and the fonts are in [`@souty/brand`](../../packages/brand). The
  list of signs is in [`@souty/vocabulary`](../../packages/vocabulary);
  import it instead of typing sign names or counts by hand.

## Editing copy

1. Edit the English text in `content/en/<section>.ts`. English is the
   source: `Dictionary` is `typeof en`.
2. Make the same change in `content/fr` and `content/ar`. If you add,
   remove or rename a key in English, TypeScript reports every translation
   that no longer matches when you run the typecheck.
3. Values typed in `content/shared.ts` (a milestone's `status`, a language
   pack's `stage`) are not translated. Copy them as they are.
4. A `{name}` placeholder in a string is filled with `format()` from
   `content/index.ts`. Keep the placeholder unchanged in translations.
5. Fields named `derja` are Tunisian Arabic lines shown above titles on
   the English and French pages. They stay in Arabic script in every
   locale.

Rules for what the copy may say:

- Every statistic needs a `source` and an `href`, as in
  `content/en/problem.ts`. Do not add numbers without one.
- Roadmap and vision items are plans. Write them in the future tense, and
  keep "live today" for what the app really does.
- Do not name an organisation as a partner or endorser unless there is a
  signed agreement.

## Adding a locale

1. In `i18n/config.ts`, add the code to `locales`, then fill in
   `localeDirection`, `localeLabel` and `localeTag`. TypeScript flags each
   record until it has the new key.
2. Create `content/<code>/index.ts` exporting an object of type
   `Dictionary`.
3. Register it in the `dictionaries` record in `content/index.ts`.
4. Add a case for the new language to `i18n/negotiate.test.ts`.

Nothing else is needed: the routes, the middleware, the `hreflang`
alternates, the sitemap and the language switcher all read `locales`.

## Environment variables

All optional. They are documented at the top of [`lib/site.ts`](lib/site.ts).

| Variable | Meaning | When unset |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin of this site | `https://` + `VERCEL_PROJECT_PRODUCTION_URL` on Vercel, otherwise `http://localhost:3001` |
| `NEXT_PUBLIC_APP_URL` | Origin of the PWA the site links to | `https://souty.vercel.app` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Address for partnership requests | The "contact us" action is hidden |

For local overrides, put them in `apps/marketing/.env.local` (ignored by
git). They are inlined at build time, so restart the dev server or rebuild
after changing one.

## What the site stores and sends

- One first-party cookie, `souty_locale`, written only when a visitor
  picks a language in the switcher. It holds the locale code.
- Vercel Web Analytics (`<Analytics />` in `app/[locale]/layout.tsx`):
  cookieless page views, recorded only when Web Analytics is enabled for
  the project in the Vercel dashboard.
