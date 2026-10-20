import { AlignmentFilter, Hero } from './hero.model';

export type HeroesStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type ListMode = 'paged' | 'infinite';

export type HeroSort = 'name-asc' | 'name-desc' | 'strength-desc' | 'intelligence-desc';

export type RangeStat =  'strength' | 'intelligence';

export interface ListModeOption {
  value: ListMode;
  label: string;
};

export interface SortOption {
  value: HeroSort;
  label: string;
};

export interface Range {
  min: number | null;
  max: number | null;
}

export const LIST_MODES: ListModeOption[] = [
  {value: 'paged', label: 'Pages'},
  {value: 'infinite', label: 'Infinite'},
];

export const SORT_OPTIONS: SortOption[] = [
  {value: 'name-asc', label: 'Name - ASC'},
  {value: 'name-desc', label: 'Name - DESC'},
  {value: 'intelligence-desc', label: 'Intelligence - DESC'},
  {value: 'strength-desc', label: 'Strength - DESC'},
];

export const RANGE_STATS: RangeStat[] = ['strength', 'intelligence'];

interface SortParams {
  sort: string;
  order: string;
};

export const SORT_PARAMS: Record<HeroSort, SortParams> = {
  'name-asc': {sort: 'name,id', order: 'asc,asc'},
  'name-desc': {sort: 'name,id', order: 'desc,asc'},
  'intelligence-desc': {sort: 'powerstats.intelligence,name,id', order: 'desc,asc,asc'},
  'strength-desc': {sort: 'powerstats.strength,name,id', order: 'desc,asc,asc'},
};

export type Ranges = Record<RangeStat, Range>;

export const EMPTY_RANGE: Range = { min: null, max: null };

export const EMPTY_RANGES: Ranges = {
  strength: EMPTY_RANGE,
  intelligence: EMPTY_RANGE,
};

export interface HeroQuery {
  term: string;
  alignment: AlignmentFilter;
  page: number;
  pageSize: number;
  sort: HeroSort;
  ranges: Ranges;
};

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
  loadMoreError: string | null;
};

export const initialQuery: HeroQuery = {
  term: '',
  alignment: 'all',
  page: 1,
  pageSize: 12,
  sort: 'name-asc',
  ranges: EMPTY_RANGES,
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
  loadingMore: false,
  loadMoreError: null,
};

export function totalPages(state: HeroesState): number {
  return Math.max(1, Math.ceil(state.total / state.query.pageSize));
}

export function isAppend(mode: ListMode, page: number): boolean {
  return mode === "infinite" && page > 1;
}

export function sameRanges(a: Ranges, b: Ranges): boolean {
  return RANGE_STATS.every(
    (stat) => a[stat].min === b[stat].min && a[stat].max === b[stat].max
  );
}
