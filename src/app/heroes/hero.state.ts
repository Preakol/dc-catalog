import { Hero } from './hero.model';
import { HeroQuery, HeroSort, initialQuery, RANGE_STATS, Ranges } from './hero-query';

export type HeroesStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type ListMode = 'paged' | 'infinite';

export interface ListModeOption {
  value: ListMode;
  label: string;
}

export interface SortOption {
  value: HeroSort;
  label: string;
}

export const LIST_MODES: ListModeOption[] = [
  { value: 'paged', label: 'Pages' },
  { value: 'infinite', label: 'Infinite' },
];

export const SORT_OPTIONS: SortOption[] = [
  { value: 'name-asc', label: 'Name - ASC' },
  { value: 'name-desc', label: 'Name - DESC' },
  { value: 'intelligence-desc', label: 'Intelligence - DESC' },
  { value: 'strength-desc', label: 'Strength - DESC' },
];

export interface HeroesState {
  heroes: Hero[];
  total: number;
  query: HeroQuery;
  status: HeroesStatus;
  error: string | null;
  importing: boolean;
  mode: ListMode;
  loadingMore: boolean;
  loadMoreError: string | null;
}

export const initialState: HeroesState = {
  heroes: [],
  total: 0,
  query: initialQuery,
  status: 'idle',
  error: null,
  importing: false,
  mode: 'paged',
  loadingMore: false,
  loadMoreError: null,
};

export function totalPages(state: Pick<HeroesState, 'total' | 'query'>): number {
  return Math.max(1, Math.ceil(state.total / state.query.pageSize));
}

export function isAppend(mode: ListMode, page: number): boolean {
  return mode === 'infinite' && page > 1;
}

export function sameRanges(a: Ranges, b: Ranges): boolean {
  return RANGE_STATS.every((stat) => a[stat].min === b[stat].min && a[stat].max === b[stat].max);
}
