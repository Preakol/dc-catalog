# DC Catalog

A searchable, filterable catalogue of DC Comics heroes built with Angular. It
supports full CRUD, a cart with Stripe test-mode card tokenisation, and a
side-by-side hero comparison.

It started as an Angular 12 + Nx learning project. The `modernize` branch
rebuilds it as a plain Angular CLI workspace with standalone components and
signals.

## Features

- **Catalogue**: debounced search across names and biographies, filters by
  alignment and by strength/intelligence ranges, four sort orders, and
  paged or infinite-scroll mode. All of this lives in the URL, so every view
  can be bookmarked and shared, and Back/Forward work as expected.
- **Discover**: a random hero from the public
  [superhero API](https://akabab.github.io/superhero-api/), which can be added
  to the catalogue with one click.
- **CRUD**: create a hero with a validated reactive form, edit it at
  `/heroes/:id/edit` (same form component), delete it from its card.
- **Detail page**: the stored hero next to its live data from the superhero
  API, with differing power stats highlighted. Heroes created locally are
  marked as such.
- **Cart and checkout**: the price comes from the power stats. Checkout
  tokenises a card with Stripe in test mode (see [Stripe](#stripe)), and paid
  heroes appear under **My heroes**.
- **Compare**: pick up to three heroes. The best value per stat is highlighted
  and the comparison URL (`/compare?ids=1,2,3`) can be shared.

Cart, orders and the compare selection are kept in `localStorage`.

## Tech stack

|            |                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------- |
| Angular    | 22: standalone components, signals, `input()`/`output()`, built-in control flow, zoneless |
| TypeScript | 6, `strict` plus strict templates                                                         |
| Styling    | Tailwind CSS 4                                                                            |
| Tests      | Vitest via `ng test`                                                                      |
| Lint       | ESLint with angular-eslint and typescript-eslint                                          |
| Node       | 22.22.3 or newer (see `.nvmrc`)                                                           |

## Getting started

```bash
nvm use            # Node 22, from .nvmrc
npm run setup      # install, generate the environment, create db.json
```

Then, in two terminals:

```bash
npm run mock-api   # REST API on http://localhost:3000
npm start          # app on http://localhost:4200
```

`npm run mock-api:slow` adds a 1200 ms delay to every response, so the loading
states and skeletons can be seen.

### Data sources

The app reads and writes heroes through a `HeroApi` abstraction with two
implementations:

| `DATA_SOURCE`   | Implementation                      | Used for                                                                       |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| `api` (default) | `HttpHeroApi` → `tools/mock-api.ts` | local development; changes are saved to `db.json`                              |
| `browser`       | `BrowserHeroApi` → `localStorage`   | GitHub Pages; seeded from a static snapshot, with a **Reset demo data** button |

`tools/mock-api.ts` is a small Node HTTP server, run by Node directly with type
stripping. Search, filters, sorting and paging live in one pure module,
`src/app/heroes/hero-query.ts`, which both the mock API and `BrowserHeroApi`
use, so the two data sources behave the same.

`db.json` and the Pages snapshot are generated from the superhero API, filtered
to the 155 DC Comics heroes, by `tools/seed-db.ts`. They are not committed.

### Environment variables

Angular has no runtime `process.env`, so `tools/set-env.ts` writes
`src/environments/environment.ts` before `start`, `build` and `test`. Values
come from the process environment first, then `.env`, then defaults.

| Variable                 | Default                                      | Purpose                                                                     |
| ------------------------ | -------------------------------------------- | --------------------------------------------------------------------------- |
| `DATA_SOURCE`            | `api`                                        | `api` or `browser`, see above                                               |
| `API_URL`                | `http://localhost:3000`                      | base URL of the mock API                                                    |
| `HEROES_API_URL`         | `https://akabab.github.io/superhero-api/api` | the public superhero API (read-only)                                        |
| `STRIPE_PUBLISHABLE_KEY` | empty                                        | Stripe **test** key (`pk_test_...`); checkout is disabled while it is empty |

Everything in this file ends up in the JavaScript bundle and is visible to
anyone, so never put secrets in it.

### Stripe

A publishable key can only tokenise a card; it cannot move money. Charging a
card needs a server with the secret key, and this project has no server. So
checkout stops after tokenisation and records the order locally. Use a test key
from https://dashboard.stripe.com/test/apikeys and a
[test card](https://docs.stripe.com/testing) such as `4242 4242 4242 4242`.

## Scripts

| Command                | Does                                                           |
| ---------------------- | -------------------------------------------------------------- |
| `npm run setup`        | install, generate the environment, create `db.json` if missing |
| `npm start`            | dev server on http://localhost:4200                            |
| `npm run mock-api`     | mock REST API on http://localhost:3000                         |
| `npm run seed:reset`   | overwrite `db.json` with fresh data, discarding local changes  |
| `npm test`             | unit and component tests (Vitest)                              |
| `npm run lint`         | ESLint over `src/` and `tools/`                                |
| `npm run typecheck`    | `tsc` for the app, the tests and the Node tools                |
| `npm run format:check` | Prettier                                                       |
| `npm run build`        | production build into `dist/dc-catalog/browser`                |

## Project structure

```
src/app/
├── app.ts / app.html / app.routes.ts / app.config.ts   shell, routes, providers
├── heroes/
│   ├── hero-query.ts        search, filters, sorting, paging (shared with tools/mock-api.ts)
│   ├── hero-guards.ts       runtime checks for stored and received hero records
│   ├── hero.store.ts        catalogue state in signals
│   ├── hero-url.ts          catalogue config <-> URL query params
│   ├── data/                HeroApi and its HTTP / localStorage implementations
│   └── hero-list/ hero-card/ hero-detail/ hero-edit/ hero-form/ pagination/
├── cart/                    CartStore, Stripe PaymentService, cart drawer and pages
└── compare/                 CompareStore, compare panel and page
tools/                       set-env.ts, seed-db.ts, mock-api.ts
```

State lives in root-provided stores (`HeroStore`, `CartStore`,
`CompareStore`). Each one holds a private `signal` and exposes read-only
`computed` selectors, and state changes only through store methods.
Components are `OnPush` and read signals directly.

## Tests

`npm test` runs Vitest through the Angular CLI. The tests cover:

- the query module, the URL mapping and the record guards;
- `BrowserHeroApi` against a mocked HTTP backend and `localStorage`;
- the stores: loading, infinite scrolling, error states, checkout and the
  compare limit;
- every page rendered through the router with an in-memory `HeroApi`.

## Deployment

`.github/workflows/ci.yml` runs format check, lint, typecheck, tests and a
build on every push and pull request. On `main` it then builds the
`browser` data-source variant and deploys it to GitHub Pages.

To deploy from a fork, set **Settings → Pages → Source** to **GitHub Actions**.
