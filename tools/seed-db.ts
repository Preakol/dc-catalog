/*
 * Builds the hero database from the public akabab superhero API, filtered to
 * DC Comics. Writes db.json for the mock API by default; `--out <file>` writes
 * the same data elsewhere (the GitHub Pages build ships it as a static file).
 *   node tools/seed-db.ts [--force] [--out public/data/heroes.json]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://akabab.github.io/superhero-api/api/all.json';
const PUBLISHER = 'DC Comics';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TIMEOUT_MS = 30_000;

interface SourceHero {
  id: number;
  biography?: { publisher?: string | null };
}

function isSourceHero(value: unknown): value is SourceHero {
  return (
    typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'number'
  );
}

function outFile(args: string[]): string {
  const index = args.indexOf('--out');

  if (index === -1) {
    return join(ROOT, 'db.json');
  }

  const path = args[index + 1];

  if (path === undefined || path.startsWith('--')) {
    throw new Error('--out needs a file path');
  }

  return resolve(ROOT, path);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const target = outFile(args);

  if (existsSync(target) && !args.includes('--force')) {
    console.log(`${target} already exists, leaving it alone. Use --force to overwrite it.`);
    return;
  }

  console.log(`Fetching ${SOURCE_URL} ...`);
  const response = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });

  if (!response.ok) {
    throw new Error(`${SOURCE_URL} responded ${response.status}`);
  }

  const all: unknown = await response.json();

  if (!Array.isArray(all)) {
    throw new Error('Expected the API to return an array of heroes');
  }

  const heroes = all
    .filter(isSourceHero)
    .filter((hero) => hero.biography?.publisher === PUBLISHER)
    .map((hero) => ({ ...hero, externalId: hero.id }));

  if (heroes.length === 0) {
    throw new Error(`No heroes found for publisher "${PUBLISHER}"`);
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify({ heroes }, null, 2));
  console.log(`Wrote ${heroes.length} ${PUBLISHER} heroes to ${target}`);
}

main().catch((error: unknown) => {
  console.error('Seeding failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
