import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, combineLatest, defer, of } from 'rxjs';
import {
  catchError,
  finalize,
  map,
  retry,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { ExternalHero, Hero, HeroFormValue } from './hero.model';
import {
  HeroQuery,
  HeroesState,
  HeroesStatus,
  initialQuery,
  initialState,
  totalPages,
} from './hero.state';
import { buildNewHero } from './hero.mapper';

const HEROES_URL = `${environment.apiUrl}/heroes`;

const EXTERNAL_API = environment.heroesApiUrl;

const EXTERNAL_MAX_ID = 731;
const EXTERNAL_DRAWS = 5;

function randomExternalId(): number {
  return 1 + Math.floor(Math.random() * EXTERNAL_MAX_ID);
}

function externalUrl(externalId: number): string {
  return `${EXTERNAL_API}/id/${externalId}.json`;
}

function toParams(query: HeroQuery): HttpParams {
  let params = new HttpParams()
    .set('_page', String(query.page))
    .set('_limit', String(query.pageSize));

  if (query.term.trim().length > 0) {
    params = params.set('q', query.term.trim());
  }

  if (query.alignment !== 'all') {
    params = params.set('biography.alignment', query.alignment);
  }

  return params;
}

@Injectable({ providedIn: 'root' })
export class HeroService {
  private readonly state$ = new BehaviorSubject<HeroesState>(initialState);

  private readonly query$ = new BehaviorSubject<HeroQuery>(initialQuery);
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  readonly heroes$: Observable<Hero[]> = this.state$.pipe(map((s) => s.heroes));
  readonly total$: Observable<number> = this.state$.pipe(map((s) => s.total));
  readonly query$$: Observable<HeroQuery> = this.state$.pipe(map((s) => s.query));
  readonly totalPages$: Observable<number> = this.state$.pipe(map(totalPages));
  readonly status$: Observable<HeroesStatus> = this.state$.pipe(map((s) => s.status));
  readonly error$: Observable<string | null> = this.state$.pipe(map((s) => s.error));
  readonly importing$: Observable<boolean> = this.state$.pipe(map((s) => s.importing));
  readonly discovering$: Observable<boolean> = this.state$.pipe(map((s) => s.discovering));

  private readonly discoverAgain$ = new Subject<void>();

  readonly discovered$: Observable<ExternalHero | null> = this.discoverAgain$.pipe(
    startWith(undefined),
    tap(() => this.patch({ discovering: true })),
    switchMap(() =>
      defer(() =>
        this.http.get<ExternalHero>(externalUrl(randomExternalId()))
      ).pipe(
        retry(EXTERNAL_DRAWS),
        catchError(() => of(null)),
        finalize(() => this.patch({ discovering: false }))
      )
    ),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  readonly discoveredImported$: Observable<boolean> = combineLatest([
    this.discovered$,
    this.refresh$,
  ]).pipe(
    switchMap(([hero]) => (hero ? this.existsByExternalId(hero.id) : of(false))),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  constructor(private http: HttpClient) {
    combineLatest([this.query$, this.refresh$])
      .pipe(
        tap(([query]) => this.patch({ query, status: 'loading', error: null })),
        switchMap(([query]) => this.fetchPage(query))
      )
      .subscribe();
  }

  setSearch(term: string): void {
    this.patchQuery({ term, page: 1 });
  }

  setAlignment(alignment: HeroQuery['alignment']): void {
    this.patchQuery({ alignment, page: 1 });
  }

  goToPage(page: number): void {
    const last = totalPages(this.state$.value);
    const clamped = Math.min(Math.max(1, page), last);

    if (clamped !== this.query$.value.page) {
      this.patchQuery({ page: clamped });
    }
  }

  reload(): void {
    this.refresh$.next();
  }

  create(input: HeroFormValue): void {
    this.write(this.http.post<Hero>(HEROES_URL, buildNewHero(input)), 'Could not create hero.');
  }

  importHero(hero: ExternalHero): void {
    const { id, ...rest } = hero;

    this.patch({ importing: true });
    this.write(
      this.http.post<Hero>(HEROES_URL, { ...rest, externalId: id }),
      'Could not import hero.',
      { importing: false }
    );
  }

  update(id: number, updated: Hero): void {
    this.write(this.http.put<Hero>(`${HEROES_URL}/${id}`, updated), 'Could not save hero.');
  }

  remove(id: number): void {
    this.write(this.http.delete<void>(`${HEROES_URL}/${id}`), 'Could not delete hero.');
  }

  getHero(id: number): Observable<Hero | undefined> {
    return this.http
      .get<Hero>(`${HEROES_URL}/${id}`)
      .pipe(catchError(() => of(undefined)));
  }

  getExternalHero(externalId: number): Observable<ExternalHero | null> {
    return this.http
      .get<ExternalHero>(externalUrl(externalId))
      .pipe(catchError(() => of(null)));
  }

  discoverAnother(): void {
    this.discoverAgain$.next();
  }

  clearError(): void {
    if (this.state$.value.error !== null) {
      this.patch({ error: null });
    }
  }

  private existsByExternalId(externalId: number): Observable<boolean> {
    const params = new HttpParams()
      .set('externalId', String(externalId))
      .set('_limit', '1');

    return this.http.get<Hero[]>(HEROES_URL, { params }).pipe(
      map((found) => found.length > 0),
      catchError(() => of(false))
    );
  }

  private fetchPage(query: HeroQuery): Observable<unknown> {
    return this.http
      .get<Hero[]>(HEROES_URL, { params: toParams(query), observe: 'response' })
      .pipe(
        tap((res: HttpResponse<Hero[]>) => {
          this.patch({
            heroes: res.body ?? [],
            total: Number(res.headers.get('X-Total-Count') ?? 0),
            status: 'loaded',
          });

          this.goToPage(query.page);
        }),
        catchError(() => {
          this.patch({ status: 'error', error: 'Could not load heroes.' });
          return of(null);
        })
      );
  }

  private write<T>(
    request$: Observable<T>,
    errorMessage: string,
    always: Partial<HeroesState> = {}
  ): void {
    request$.subscribe({
      next: () => {
        this.patch(always);
        this.reload();
      },
      error: () => this.patch({ ...always, error: errorMessage }),
    });
  }

  private patchQuery(changes: Partial<HeroQuery>): void {
    this.query$.next({ ...this.query$.value, ...changes });
  }

  private patch(changes: Partial<HeroesState>): void {
    this.state$.next({ ...this.state$.value, ...changes });
  }
}
