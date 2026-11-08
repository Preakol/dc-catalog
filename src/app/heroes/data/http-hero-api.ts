import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, map, Observable, of, OperatorFunction, throwError } from 'rxjs';

import { Hero, NewHero } from '../hero.model';
import { HeroPage, HeroQuery, toApiParams } from '../hero-query';
import { HeroApi } from './hero-api';

export const API_URL = new InjectionToken<string>('API_URL');

function notFoundAs<T, R>(value: R): OperatorFunction<T, T | R> {
  return catchError((error: unknown) =>
    error instanceof HttpErrorResponse && error.status === 404
      ? of(value)
      : throwError(() => error),
  );
}

/** Talks to tools/mock-api.ts. */
@Injectable()
export class HttpHeroApi extends HeroApi {
  private readonly http = inject(HttpClient);
  private readonly heroesUrl = `${inject(API_URL)}/heroes`;

  list(query: HeroQuery): Observable<HeroPage> {
    return this.http.get<HeroPage>(this.heroesUrl, {
      params: new HttpParams({ fromObject: toApiParams(query) }),
    });
  }

  get(id: number): Observable<Hero | undefined> {
    return this.http.get<Hero>(`${this.heroesUrl}/${id}`).pipe(notFoundAs(undefined));
  }

  getMany(ids: readonly number[]): Observable<Hero[]> {
    if (ids.length === 0) {
      return of([]);
    }

    return this.http.get<Hero[]>(`${this.heroesUrl}/batch`, { params: { ids: ids.join(',') } });
  }

  existsByExternalId(externalId: number): Observable<boolean> {
    return this.http.get<Hero>(`${this.heroesUrl}/external/${externalId}`).pipe(
      map(() => true),
      notFoundAs(false),
    );
  }

  create(hero: NewHero): Observable<Hero> {
    return this.http.post<Hero>(this.heroesUrl, hero);
  }

  update(hero: Hero): Observable<Hero> {
    return this.http.put<Hero>(`${this.heroesUrl}/${hero.id}`, hero);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.heroesUrl}/${id}`);
  }
}
