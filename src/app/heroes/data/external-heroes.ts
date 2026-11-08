import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, defer, Observable, of, retry } from 'rxjs';

import { ExternalHero } from '../hero.model';

export const HEROES_API_URL = new InjectionToken<string>('HEROES_API_URL');

const EXTERNAL_MAX_ID = 731;
const EXTERNAL_DRAWS = 5;

function randomExternalId(): number {
  return 1 + Math.floor(Math.random() * EXTERNAL_MAX_ID);
}

/** The public, read-only akabab superhero API. */
@Injectable({ providedIn: 'root' })
export class ExternalHeroes {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(HEROES_API_URL);

  /** Null when the API cannot be reached or has no hero with this id. */
  get(externalId: number): Observable<ExternalHero | null> {
    return this.http.get<ExternalHero>(this.url(externalId)).pipe(catchError(() => of(null)));
  }

  /** A random hero; ids without a hero are retried a few times before giving up with null. */
  random(): Observable<ExternalHero | null> {
    return defer(() => this.http.get<ExternalHero>(this.url(randomExternalId()))).pipe(
      retry(EXTERNAL_DRAWS),
      catchError(() => of(null)),
    );
  }

  private url(externalId: number): string {
    return `${this.baseUrl}/id/${externalId}.json`;
  }
}
