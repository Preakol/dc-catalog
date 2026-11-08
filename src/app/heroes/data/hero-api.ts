import { Observable } from 'rxjs';

import { Hero, NewHero } from '../hero.model';
import { HeroPage, HeroQuery } from '../hero-query';

/** Where the catalogue lives: the mock REST API or the browser's localStorage. */
export abstract class HeroApi {
  abstract list(query: HeroQuery): Observable<HeroPage>;

  /** Emits `undefined` when no hero has this id. */
  abstract get(id: number): Observable<Hero | undefined>;

  /** Heroes that exist among `ids`, in any order. */
  abstract getMany(ids: readonly number[]): Observable<Hero[]>;

  abstract existsByExternalId(externalId: number): Observable<boolean>;

  abstract create(hero: NewHero): Observable<Hero>;

  abstract update(hero: Hero): Observable<Hero>;

  abstract remove(id: number): Observable<void>;
}
