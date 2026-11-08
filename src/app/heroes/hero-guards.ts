/*
 * Runtime checks for hero records read from storage or HTTP bodies. Shared with
 * tools/mock-api.ts, so like hero-query.ts it may only import types.
 */
import type { Hero, NewHero, PowerStats } from './hero.model';

const STAT_KEYS: (keyof PowerStats)[] = [
  'intelligence',
  'strength',
  'speed',
  'durability',
  'power',
  'combat',
];

const SECTIONS = ['appearance', 'biography', 'work', 'connections'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Checks the fields the app reads; other fields of the record are kept as they are. */
export function isNewHero(value: unknown): value is NewHero {
  if (!isRecord(value)) {
    return false;
  }

  const { externalId, name, slug, powerstats, images } = value;

  return (
    (externalId === null || typeof externalId === 'number') &&
    typeof name === 'string' &&
    typeof slug === 'string' &&
    isRecord(powerstats) &&
    STAT_KEYS.every((key) => typeof powerstats[key] === 'number') &&
    isRecord(images) &&
    typeof images['md'] === 'string' &&
    SECTIONS.every((key) => isRecord(value[key]))
  );
}

export function isHero(value: unknown): value is Hero {
  return isRecord(value) && typeof value['id'] === 'number' && isNewHero(value);
}

export function isHeroList(value: unknown): value is Hero[] {
  return Array.isArray(value) && value.every(isHero);
}
