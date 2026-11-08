/*
 * Catalogue querying shared by the browser data source and the Node mock API
 * (tools/mock-api.ts). Node runs this file directly by stripping types, so it
 * may only import types: no runtime imports from other app files.
 */
import type { Hero } from './hero.model';

export const ALIGNMENTS = ['good', 'bad', 'neutral'] as const;
export type Alignment = (typeof ALIGNMENTS)[number];

export const ALIGNMENT_FILTERS = ['all', ...ALIGNMENTS] as const;
export type AlignmentFilter = (typeof ALIGNMENT_FILTERS)[number];

export const HERO_SORTS = ['name-asc', 'name-desc', 'intelligence-desc', 'strength-desc'] as const;
export type HeroSort = (typeof HERO_SORTS)[number];

export const RANGE_STATS = ['strength', 'intelligence'] as const;
export type RangeStat = (typeof RANGE_STATS)[number];

export interface Range {
  min: number | null;
  max: number | null;
}

export type Ranges = Record<RangeStat, Range>;

export const EMPTY_RANGE: Range = { min: null, max: null };

export const EMPTY_RANGES: Ranges = { strength: EMPTY_RANGE, intelligence: EMPTY_RANGE };

export const DEFAULT_PAGE_SIZE = 12;

const MAX_PAGE_SIZE = 100;

export interface HeroQuery {
  term: string;
  alignment: AlignmentFilter;
  page: number;
  pageSize: number;
  sort: HeroSort;
  ranges: Ranges;
}

export interface HeroPage {
  heroes: Hero[];
  total: number;
}

export const initialQuery: HeroQuery = {
  term: '',
  alignment: 'all',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  sort: 'name-asc',
  ranges: EMPTY_RANGES,
};

/** Reads one parameter value: first string of an array, trimmed; anything else is ''. */
export function readText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0].trim();
  }

  return '';
}

/** A whole number from 0 to 100, or null. */
export function readBound(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const bound = Number(value);

  return bound <= 100 ? bound : null;
}

/** A positive whole number, or `fallback`. */
export function readPositive(value: string, fallback: number): number {
  if (!/^\d+$/.test(value)) {
    return fallback;
  }

  const number = Number(value);

  return number >= 1 ? number : fallback;
}

export function readAlignment(value: string): AlignmentFilter {
  return ALIGNMENT_FILTERS.find((item) => item === value) ?? initialQuery.alignment;
}

export function readSort(value: string): HeroSort {
  return HERO_SORTS.find((item) => item === value) ?? initialQuery.sort;
}

/** Reads `<stat>Min`/`<stat>Max`; an inverted range is dropped as a whole. */
export function readRanges(get: (name: string) => unknown): Ranges {
  const read = (stat: RangeStat): Range => {
    const min = readBound(readText(get(`${stat}Min`)));
    const max = readBound(readText(get(`${stat}Max`)));

    return min !== null && max !== null && min > max ? EMPTY_RANGE : { min, max };
  };

  return { strength: read('strength'), intelligence: read('intelligence') };
}

export function rangeParams(ranges: Ranges): Record<string, string> {
  const params: Record<string, string> = {};

  for (const stat of RANGE_STATS) {
    const { min, max } = ranges[stat];

    if (min !== null) {
      params[`${stat}Min`] = String(min);
    }

    if (max !== null) {
      params[`${stat}Max`] = String(max);
    }
  }

  return params;
}

export function toApiParams(query: HeroQuery): Record<string, string> {
  const params: Record<string, string> = {
    page: String(query.page),
    pageSize: String(query.pageSize),
    sort: query.sort,
    ...rangeParams(query.ranges),
  };

  if (query.term.trim() !== '') {
    params['term'] = query.term.trim();
  }

  if (query.alignment !== 'all') {
    params['alignment'] = query.alignment;
  }

  return params;
}

export function fromApiParams(get: (name: string) => unknown): HeroQuery {
  return {
    term: readText(get('term')),
    alignment: readAlignment(readText(get('alignment'))),
    page: readPositive(readText(get('page')), 1),
    pageSize: Math.min(MAX_PAGE_SIZE, readPositive(readText(get('pageSize')), DEFAULT_PAGE_SIZE)),
    sort: readSort(readText(get('sort'))),
    ranges: readRanges(get),
  };
}

const PLACEHOLDERS = new Set(['-', 'No alter egos found.']);

const HAS_LETTER = /\p{L}/u;

type TextField = (hero: Hero) => string | string[] | null | undefined;

const SEARCH_FIELDS: TextField[] = [
  (hero) => hero.name,
  (hero) => hero.biography?.fullName,
  (hero) => hero.biography?.alterEgos,
  (hero) => hero.biography?.aliases,
  (hero) => hero.biography?.firstAppearance,
  (hero) => hero.biography?.publisher,
  (hero) => hero.connections?.groupAffiliation,
  (hero) => hero.connections?.relatives,
  (hero) => hero.work?.occupation,
];

const LETTERLESS_SEARCH_FIELDS: TextField[] = [(hero) => hero.name];

function texts(value: string | string[] | null | undefined): string[] {
  if (typeof value === 'string') {
    return [value];
  }

  return Array.isArray(value) ? value : [];
}

/** Case-insensitive substring match over the hero's text fields. */
export function matchesTerm(hero: Hero, term: string): boolean {
  const needle = term.trim().toLowerCase();

  if (needle === '') {
    return true;
  }

  const fields = HAS_LETTER.test(needle) ? SEARCH_FIELDS : LETTERLESS_SEARCH_FIELDS;

  return fields.some((field) =>
    texts(field(hero)).some(
      (text) => !PLACEHOLDERS.has(text) && text.toLowerCase().includes(needle),
    ),
  );
}

function inRange(value: number, { min, max }: Range): boolean {
  return (min === null || value >= min) && (max === null || value <= max);
}

function matches(hero: Hero, query: HeroQuery): boolean {
  return (
    (query.alignment === 'all' || hero.biography?.alignment === query.alignment) &&
    RANGE_STATS.every((stat) => inRange(hero.powerstats[stat], query.ranges[stat])) &&
    matchesTerm(hero, query.term)
  );
}

function compareText(a: string, b: string): number {
  if (a === b) {
    return 0;
  }

  return a < b ? -1 : 1;
}

function byNameThenId(a: Hero, b: Hero): number {
  return compareText(a.name, b.name) || a.id - b.id;
}

const COMPARATORS: Record<HeroSort, (a: Hero, b: Hero) => number> = {
  'name-asc': byNameThenId,
  'name-desc': (a, b) => compareText(b.name, a.name) || a.id - b.id,
  'intelligence-desc': (a, b) =>
    b.powerstats.intelligence - a.powerstats.intelligence || byNameThenId(a, b),
  'strength-desc': (a, b) => b.powerstats.strength - a.powerstats.strength || byNameThenId(a, b),
};

/** The requested page of heroes matching `query`, plus the number of matches. */
export function queryHeroes(all: readonly Hero[], query: HeroQuery): HeroPage {
  const matching = all.filter((hero) => matches(hero, query)).sort(COMPARATORS[query.sort]);
  const start = (query.page - 1) * query.pageSize;

  return { heroes: matching.slice(start, start + query.pageSize), total: matching.length };
}

/** The next free numeric id. */
export function nextId(all: readonly Hero[]): number {
  return all.reduce((max, hero) => Math.max(max, hero.id), 0) + 1;
}
