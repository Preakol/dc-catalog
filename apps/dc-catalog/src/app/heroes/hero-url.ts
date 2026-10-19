import { Params } from '@angular/router';
import { ALIGNMENT_FILTERS, AlignmentFilter } from './hero.model';
import { HeroSort, LIST_MODES, ListMode, SORT_OPTIONS } from './hero.state';

export interface CatalogConfig {
  search: string;
  alignment: AlignmentFilter;
  mode: ListMode;
  page: number;
  sort: HeroSort;
}

export const DEFAULT_CONFIG: CatalogConfig = {
  search: '',
  alignment: 'all',
  mode: 'paged',
  page: 1,
  sort: 'name-asc',
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

function readAlignment(value: string): AlignmentFilter {
  return ALIGNMENT_FILTERS.find((item) => item === value) ?? DEFAULT_CONFIG.alignment;
}

function readMode(value: string): ListMode {
  return LIST_MODES.find((option) => option.value === value)?.value ?? DEFAULT_CONFIG.mode;
}

function readSort(value: string): HeroSort {
  return SORT_OPTIONS.find((option) => option.value === value)?.value ?? DEFAULT_CONFIG.sort;
}

function readPage(value: string): number {
  if (!/^\d+$/.test(value)) {
    return DEFAULT_CONFIG.page;
  }

  const page = Number(value);

  return page >= 1 ? page : DEFAULT_CONFIG.page;
}
