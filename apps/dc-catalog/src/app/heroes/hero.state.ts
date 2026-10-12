import { AlignmentFilter, Hero } from './hero.model';

export type HeroesStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type ListMode = 'paged' | 'infinite';

export interface ListModeOption {
  value: ListMode;
  label: string;
}

export const LIST_MODES: ListModeOption[] = [
  {value: 'paged', label: 'Pages'},
  {value: 'infinite', label: 'Infinite'}
]

export interface HeroQuery {
  term: string;
  alignment: AlignmentFilter;
  page: number;
  pageSize: number;
}

export interface HeroesState {
  heroes: Hero[];
  total: number;
  query: HeroQuery;
  status: HeroesStatus;
  error: string | null;
  importing: boolean;
  discovering: boolean;
  mode: ListMode;
  loadingMore: boolean;
}

export const initialQuery: HeroQuery = {
  term: '',
  alignment: 'all',
  page: 1,
  pageSize: 12,
};

export const initialState: HeroesState = {
  heroes: [],
  total: 0,
  query: initialQuery,
  status: 'idle',
  error: null,
  importing: false,
  discovering: false,
  mode: 'paged',
  loadingMore: false
};

export function totalPages(state: HeroesState): number {
  return Math.max(1, Math.ceil(state.total / state.query.pageSize));
}

export function isAppend(mode: ListMode, page: number): boolean {
  return mode === "infinite" && page > 1;
}
