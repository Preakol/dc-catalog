import { Params } from '@angular/router';

import {
  AlignmentFilter,
  EMPTY_RANGES,
  HeroSort,
  rangeParams,
  Ranges,
  readAlignment,
  readPositive,
  readRanges,
  readSort,
  readText,
} from './hero-query';
import { LIST_MODES, ListMode } from './hero.state';

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

export function resetConfig(config: CatalogConfig): CatalogConfig {
  return { ...DEFAULT_CONFIG, mode: config.mode };
}

export function canReset(config: CatalogConfig): boolean {
  return !sameParams(toQueryParams(config), toQueryParams(resetConfig(config)));
}

/** URL query params for `config`, leaving out everything that is at its default. */
export function toQueryParams(config: CatalogConfig): Params {
  const params: Params = {};
  const search = config.search.trim();

  if (search !== DEFAULT_CONFIG.search) {
    params['search'] = search;
  }

  if (config.alignment !== DEFAULT_CONFIG.alignment) {
    params['alignment'] = config.alignment;
  }

  if (config.mode !== DEFAULT_CONFIG.mode) {
    params['mode'] = config.mode;
  }

  if (config.sort !== DEFAULT_CONFIG.sort) {
    params['sort'] = config.sort;
  }

  Object.assign(params, rangeParams(config.ranges));

  if (config.mode === 'paged' && config.page !== DEFAULT_CONFIG.page) {
    params['page'] = String(config.page);
  }

  return params;
}

export function fromQueryParams(params: Params): CatalogConfig {
  return {
    search: readText(params['search']),
    alignment: readAlignment(readText(params['alignment'])),
    mode: readMode(readText(params['mode'])),
    page: readPositive(readText(params['page']), DEFAULT_CONFIG.page),
    sort: readSort(readText(params['sort'])),
    ranges: readRanges((name) => params[name]),
  };
}

export function sameParams(a: Params, b: Params): boolean {
  const keys = Object.keys(a);

  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

function readMode(value: string): ListMode {
  return LIST_MODES.find((option) => option.value === value)?.value ?? DEFAULT_CONFIG.mode;
}
