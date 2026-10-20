import { Params } from '@angular/router';
import { ALIGNMENT_FILTERS, AlignmentFilter } from './hero.model';
import { EMPTY_RANGE, EMPTY_RANGES, HeroSort, LIST_MODES, ListMode, Range, RANGE_STATS, Ranges, RangeStat, SORT_OPTIONS } from './hero.state';

export interface CatalogConfig {
  search: string;
  alignment: AlignmentFilter;
  mode: ListMode;
  page: number;
  sort: HeroSort;
  ranges: Ranges;
}

export const DEFAULT_CONFIG: CatalogConfig = {
  search: '',
  alignment: 'all',
  mode: 'paged',
  page: 1,
  sort: 'name-asc',
  ranges: EMPTY_RANGES,
};

export function toQueryParams(config: CatalogConfig): Params {
  const params: Params = {};
  const search = config.search.trim();

  if (search !== DEFAULT_CONFIG.search) {
    params.search = search;
  }

  if (config.alignment !== DEFAULT_CONFIG.alignment) {
    params.alignment = config.alignment;
  }

  if (config.mode !== DEFAULT_CONFIG.mode) {
    params.mode = config.mode;
  }

  if (config.sort !== DEFAULT_CONFIG.sort) {
    params.sort = config.sort;
  }

  RANGE_STATS.forEach((stat) => {
    const {min, max} = config.ranges[stat];

    if (min !== null) {
        params[`${stat}Min`] = String(min);
    }

    if (max !== null) {
        params[`${stat}Max`] = String(max);
    }
  });

  if (config.mode === 'paged' && config.page !== DEFAULT_CONFIG.page) {
    params.page = String(config.page);
  }

  return params;
}

export function fromQueryParams(params: Params): CatalogConfig {
  return {
    search: readText(params.search),
    alignment: readAlignment(readText(params.alignment)),
    mode: readMode(readText(params.mode)),
    page: readPage(readText(params.page)),
    sort: readSort(readText(params.sort)),
    ranges: {
        strength: readRange(params, 'strength'),
        intelligence: readRange(params, 'intelligence')
    },
  };
}

export function sameParams(a: Params, b: Params): boolean {
  const keys = Object.keys(a);

  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

function readText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0].trim();
  }

  return '';
}

function readBound(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const bound = Number(value);

  return bound <= 100 ? bound : null;
}

function readAlignment(value: string): AlignmentFilter {
  return ALIGNMENT_FILTERS.find((item) => item === value) ?? DEFAULT_CONFIG.alignment;
}

function readMode(value: string): ListMode {
  return LIST_MODES.find((option) => option.value === value)?.value ?? DEFAULT_CONFIG.mode;
}

function readSort(value: string): HeroSort {
  return SORT_OPTIONS.find((option) => option.value === value)?.value ?? DEFAULT_CONFIG.sort;
}

function readRange(params: Params, stat: RangeStat): Range {
  const min = readBound(readText(params[`${stat}Min`]));
  const max = readBound(readText(params[`${stat}Max`]));

  if (min !== null && max !== null && min > max) {
    return EMPTY_RANGE;
  }

  return { min, max };
}

function readPage(value: string): number {
  if (!/^\d+$/.test(value)) {
    return DEFAULT_CONFIG.page;
  }

  const page = Number(value);

  return page >= 1 ? page : DEFAULT_CONFIG.page;
}
