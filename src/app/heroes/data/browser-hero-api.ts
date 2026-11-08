import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { defer, map, Observable, of, shareReplay, tap } from 'rxjs';

import { Hero, NewHero } from '../hero.model';
import { HeroPage, HeroQuery, nextId, queryHeroes } from '../hero-query';
import { HeroApi } from './hero-api';
import { isHeroList } from '../hero-guards';
import { loadHeroes, saveHeroes } from './hero-storage';

/** Path of the static snapshot shipped with the GitHub Pages build (tools/seed-db.ts --out). */
export const SNAPSHOT_URL = 'data/heroes.json';

/**
 * Keeps the whole catalogue in localStorage, seeded from a static snapshot on
 * first use. Used where no backend exists, e.g. on GitHub Pages.
 */
@Injectable()
export class BrowserHeroApi extends HeroApi {
  private readonly http = inject(HttpClient);

  private heroes$ = this.loadOnce();

  list(query: HeroQuery): Observable<HeroPage> {
    return this.heroes$.pipe(map((heroes) => queryHeroes(heroes, query)));
  }

  get(id: number): Observable<Hero | undefined> {
    return this.heroes$.pipe(map((heroes) => heroes.find((hero) => hero.id === id)));
  }

  getMany(ids: readonly number[]): Observable<Hero[]> {
    return this.heroes$.pipe(map((heroes) => heroes.filter((hero) => ids.includes(hero.id))));
  }

  existsByExternalId(externalId: number): Observable<boolean> {
    return this.heroes$.pipe(
      map((heroes) => heroes.some((hero) => hero.externalId === externalId)),
    );
  }

  create(hero: NewHero): Observable<Hero> {
    return this.change((heroes) => {
      const created: Hero = { ...hero, id: nextId(heroes) };
      return { heroes: [...heroes, created], result: created };
    });
  }

  update(hero: Hero): Observable<Hero> {
    return this.change((heroes) => {
      if (!heroes.some((item) => item.id === hero.id)) {
        throw new Error(`Hero ${hero.id} does not exist.`);
      }

      return { heroes: heroes.map((item) => (item.id === hero.id ? hero : item)), result: hero };
    });
  }

  remove(id: number): Observable<void> {
    return this.change((heroes) => ({
      heroes: heroes.filter((hero) => hero.id !== id),
      result: undefined,
    }));
  }

  /** Drops local changes and starts again from the snapshot. */
  reset(): Observable<void> {
    this.heroes$ = this.fetchSnapshot();
    return this.heroes$.pipe(map(() => undefined));
  }

  private change<T>(apply: (heroes: Hero[]) => { heroes: Hero[]; result: T }): Observable<T> {
    return this.heroes$.pipe(
      map((heroes) => apply(heroes)),
      tap(({ heroes }) => {
        if (!saveHeroes(heroes)) {
          throw new Error('The browser refused to store the catalogue.');
        }

        this.heroes$ = of(heroes);
      }),
      map(({ result }) => result),
    );
  }

  private loadOnce(): Observable<Hero[]> {
    return defer(() => {
      const stored = loadHeroes();
      return stored === null ? this.fetchSnapshot() : of(stored);
    }).pipe(shareReplay({ bufferSize: 1, refCount: false }));
  }

  private fetchSnapshot(): Observable<Hero[]> {
    return this.http.get<unknown>(SNAPSHOT_URL).pipe(
      map((body) => {
        const heroes =
          typeof body === 'object' && body !== null && 'heroes' in body ? body.heroes : null;

        if (!isHeroList(heroes)) {
          throw new Error('The hero snapshot is malformed.');
        }

        saveHeroes(heroes);
        return heroes;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }
}
