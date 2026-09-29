import { Hero } from './hero.model';

export type HeroesStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface HeroesState {
  heroes: Hero[];
  status: HeroesStatus;
  error: string | null;
  importing: boolean;
  discovering: boolean;
}

export const initialState: HeroesState = {
  heroes: [],
  status: 'idle',
  error: null,
  importing: false,
  discovering: false,
};
