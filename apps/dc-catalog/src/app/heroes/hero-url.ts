import { Params } from '@angular/router';
import { AlignmentFilter } from './hero.model';
import { ListMode } from './hero.state';

export interface CatalogConfig {
  search: string;
  alignment: AlignmentFilter;
  mode: ListMode;
  page: number;
}

export const DEFAULT_CONFIG: CatalogConfig = {
  search: '',
  alignment: 'all',
  mode: 'paged',
  page: 1,
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

  if (config.mode === 'paged' && config.page !== DEFAULT_CONFIG.page) {
    params.page = String(config.page);
  }

  return params;
}

export function sameParams(a: Params, b: Params): boolean {
  const keys = Object.keys(a);

  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}
