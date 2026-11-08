/*
 * Local REST API for development, persisted in db.json (see tools/seed-db.ts).
 * Filtering, search, sorting and paging come from src/app/heroes/hero-query.ts,
 * the same code the browser data source uses.
 *   node tools/mock-api.ts [--port 3000] [--delay 1200]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isHeroList, isNewHero } from '../src/app/heroes/hero-guards.ts';
import type { Hero, NewHero } from '../src/app/heroes/hero.model.ts';
import { fromApiParams, nextId, queryHeroes } from '../src/app/heroes/hero-query.ts';

const DB_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'db.json');
const MAX_BODY_BYTES = 1_000_000;

class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function option(name: string, fallback: number): number {
  const index = process.argv.indexOf(`--${name}`);
  const value = index === -1 ? undefined : Number(process.argv[index + 1]);

  return value !== undefined && Number.isInteger(value) && value >= 0 ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readDb(): Hero[] {
  if (!existsSync(DB_FILE)) {
    throw new Error('db.json not found. Run "npm run seed" first.');
  }

  const db: unknown = JSON.parse(readFileSync(DB_FILE, 'utf8'));
  const heroes = isRecord(db) ? db['heroes'] : undefined;

  if (!isHeroList(heroes)) {
    throw new Error('db.json is malformed. Run "npm run seed:reset" to recreate it.');
  }

  return heroes;
}

function writeDb(heroes: Hero[]): void {
  writeFileSync(DB_FILE, JSON.stringify({ heroes }, null, 2));
}

async function readHero(req: IncomingMessage): Promise<NewHero> {
  let size = 0;
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    size += buffer.length;

    if (size > MAX_BODY_BYTES) {
      throw new HttpError(413, 'Request body too large');
    }

    chunks.push(buffer);
  }

  try {
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));

    if (!isNewHero(body)) {
      throw new HttpError(400, 'Expected a hero object');
    }

    return body;
  } catch (error) {
    throw error instanceof HttpError ? error : new HttpError(400, 'Invalid JSON');
  }
}

function send(res: ServerResponse, status: number, body?: unknown): void {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
  });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

function parseId(raw: string): number {
  const id = Number(raw);

  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(400, `Invalid id: ${raw}`);
  }

  return id;
}

function findIndex(heroes: Hero[], id: number): number {
  const index = heroes.findIndex((hero) => hero.id === id);

  if (index === -1) {
    throw new HttpError(404, `Hero ${id} not found`);
  }

  return index;
}

async function route(req: IncomingMessage, url: URL): Promise<{ status: number; body?: unknown }> {
  const parts = url.pathname.split('/').filter(Boolean);

  if (parts[0] !== 'heroes') {
    throw new HttpError(404, 'Not found');
  }

  const heroes = readDb();
  const [, first, second] = parts;

  if (req.method === 'GET' && first === undefined) {
    return {
      status: 200,
      body: queryHeroes(
        heroes,
        fromApiParams((name) => url.searchParams.get(name)),
      ),
    };
  }

  if (req.method === 'GET' && first === 'batch') {
    const ids = (url.searchParams.get('ids') ?? '').split(',').filter(Boolean).map(parseId);
    return { status: 200, body: heroes.filter((hero) => ids.includes(hero.id)) };
  }

  if (req.method === 'GET' && first === 'external' && second !== undefined) {
    const externalId = parseId(second);
    const hero = heroes.find((item) => item.externalId === externalId);

    if (hero === undefined) {
      throw new HttpError(404, `No hero imported from ${externalId}`);
    }

    return { status: 200, body: hero };
  }

  if (req.method === 'POST' && first === undefined) {
    const created: Hero = { ...(await readHero(req)), id: nextId(heroes) };
    writeDb([...heroes, created]);
    return { status: 201, body: created };
  }

  if (first === undefined || second !== undefined) {
    throw new HttpError(404, 'Not found');
  }

  const id = parseId(first);
  const index = findIndex(heroes, id);

  switch (req.method) {
    case 'GET':
      return { status: 200, body: heroes[index] };
    case 'PUT': {
      const updated: Hero = { ...(await readHero(req)), id };
      writeDb(heroes.map((hero, i) => (i === index ? updated : hero)));
      return { status: 200, body: updated };
    }
    case 'DELETE':
      writeDb(heroes.filter((hero) => hero.id !== id));
      return { status: 204 };
    default:
      throw new HttpError(405, 'Method not allowed');
  }
}

const port = option('port', 3000);
const delayMs = option('delay', 0);

readDb();

createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    send(res, 204);
    return;
  }

  const url = new URL(req.url ?? '/', `http://localhost:${port}`);

  setTimeout(() => {
    route(req, url)
      .then(({ status, body }) => send(res, status, body))
      .catch((error: unknown) => {
        const status = error instanceof HttpError ? error.status : 500;
        const message = error instanceof Error ? error.message : 'Internal error';
        send(res, status, { error: message });
      });
  }, delayMs);
}).listen(port, () => {
  console.log(
    `Mock API on http://localhost:${port}/heroes${delayMs > 0 ? ` (delay ${delayMs} ms)` : ''}`,
  );
});
