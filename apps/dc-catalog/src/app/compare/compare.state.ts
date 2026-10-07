import { Hero } from '../heroes/hero.model';
import { CompareEntry, CompareRow } from './compare.model';

export type CompareStatus = 'loading' | 'empty' | 'error' | 'not-found' | 'ready';

export interface CompareReady {
  status: 'ready';
  heroes: Hero[];
  missingIds: number[];
  rows: CompareRow[];
}

export type CompareView =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'not-found'; requestedIds: number[] }
  | CompareReady;

export interface CompareState {
  entries: CompareEntry[];
}

export const initialCompareState: CompareState = {
  entries: [],
};
