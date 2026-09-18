# DC Catalog

A small Angular learning project: a searchable, filterable catalogue of DC Comics
heroes with full CRUD against a local REST API.

Built to practise Angular 12, Tailwind, RxJS and Nx.

| | Version |
| --- | --- |
| Angular | 12.2 |
| RxJS | 6.6 |
| TypeScript | 4.3 |
| Tailwind CSS | 3.2.4 |
| Nx | 12.10 |
| Node | 16 (see `.nvmrc`) |

## Prerequisites

**Node 16 is required.** Angular 12 uses a webpack version that relies on an MD4
hash OpenSSL 3 removed, so the build fails on Node 17+ with
`ERR_OSSL_EVP_UNSUPPORTED`.

With [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install 16
nvm use          # reads .nvmrc
```

## Setup

One command — installs dependencies and creates `db.json`:

```bash
npm run setup
```

`db.json` is the database for the mock API. It is seeded from the free
[akabab superhero API](https://akabab.github.io/superhero-api/), filtered to the
155 heroes published by DC Comics. It is generated rather than committed, so it
will not exist until you run setup.

## Running

Two terminals, both from the project root.

**Terminal 1 — the mock API** (http://localhost:3000):

```bash
npm run mock-api
```

**Terminal 2 — the app** (http://localhost:4200):

```bash
npm start
```

The app expects the API on port 3000. With no API running, the page shows an
error state and a retry button.

## Scripts

| Command | Does |
| --- | --- |
| `npm run setup` | Install dependencies and create `db.json` if missing |
| `npm start` | Dev server on http://localhost:4200 |
| `npm run mock-api` | json-server on http://localhost:3000 |
| `npm run seed:reset` | Overwrite `db.json` with fresh data (discards local changes) |
| `npm run build` | Production build into `dist/` |
| `npx nx lint dc-catalog` | Lint |
| `npx nx test dc-catalog` | Unit tests |

Writes made in the app are persisted by json-server straight into `db.json`, so
they survive a restart. Use `npm run seed:reset` to get back to a clean dataset.

## Features

- List heroes with live search (debounced) and filtering by alignment
- Create a hero via a validated reactive form
- Edit a hero at `/heroes/:id/edit`, sharing the same form component
- Delete a hero from its card

## Structure

```
apps/dc-catalog/src/app/
├── app.module.ts              registrations
├── app-routing.module.ts      routes
├── app.component.*            shell: header + <router-outlet>
└── heroes/
    ├── hero.model.ts          Hero types + pure helpers (filtering, form <-> hero)
    ├── hero.service.ts        HTTP + state (BehaviorSubject)
    ├── hero-list/             catalogue: search, filters, grid
    ├── hero-card/             one hero; emits (deleted)
    ├── hero-form/             reusable create/edit form; emits (submitted)
    └── hero-edit/             reads :id from the route, feeds the form
```

Application state lives in `HeroService`: a private `BehaviorSubject<HeroesState>`
exposed only as read-only observables, mutated only through service methods
(`load`, `create`, `update`, `remove`). This mirrors the shape of an NgRx store
so it can be migrated later.

## Notes

- `.npmrc` sets `legacy-peer-deps=true`. Angular 12's build tooling declares a
  peer range of `tailwindcss@^2`, which predates Tailwind 3; the integration
  itself works fine, and Angular 13 later widened that range.
- `npm audit` reports vulnerabilities in the build-time toolchain. They come with
  pinning a five-year-old Angular. Do **not** run `npm audit fix --force` — it
  upgrades Angular past 12 and breaks the workspace.
