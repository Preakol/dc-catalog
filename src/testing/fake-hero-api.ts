import { Observable, of, throwError } from 'rxjs';

import { HeroApi } from '../app/heroes/data/hero-api';
import { Hero, NewHero } from '../app/heroes/hero.model';
import { HeroPage, HeroQuery, nextId, queryHeroes } from '../app/heroes/hero-query';

/** In-memory HeroApi; set `failing` to make every call error. */
export class FakeHeroApi extends HeroApi {
  failing = false;
  readonly queries: HeroQuery[] = [];

  constructor(public heroes: Hero[] = []) {
    super();
  }

  list(query: HeroQuery): Observable<HeroPage> {
    this.queries.push(query);
    return this.result(() => queryHeroes(this.heroes, query));
  }

  get(id: number): Observable<Hero | undefined> {
    return this.result(() => this.heroes.find((hero) => hero.id === id));
  }

  getMany(ids: readonly number[]): Observable<Hero[]> {
    return this.result(() => this.heroes.filter((hero) => ids.includes(hero.id)));
  }

  existsByExternalId(externalId: number): Observable<boolean> {
    return this.result(() => this.heroes.some((hero) => hero.externalId === externalId));
  }

  create(hero: NewHero): Observable<Hero> {
    return this.result(() => {
      const created: Hero = { ...hero, id: nextId(this.heroes) };
      this.heroes = [...this.heroes, created];
      return created;
    });
  }

  update(hero: Hero): Observable<Hero> {
    return this.result(() => {
      this.heroes = this.heroes.map((item) => (item.id === hero.id ? hero : item));
      return hero;
    });
  }

  remove(id: number): Observable<void> {
    return this.result(() => {
      this.heroes = this.heroes.filter((hero) => hero.id !== id);
    });
  }

  private result<T>(compute: () => T): Observable<T> {
    return this.failing ? throwError(() => new Error('offline')) : of(compute());
  }
}
