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
  ListMode,
  HeroesState,
  HeroesStatus,
  initialQuery,
  initialState,
  totalPages,
  isAppend,
  SORT_PARAMS,
  sameRanges,
} from './hero.state';
import { buildNewHero } from './hero.mapper';
import { CatalogConfig } from './hero-url';

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
  const { sort, order } = SORT_PARAMS[query.sort];

  let params = new HttpParams()
    .set('_page', String(query.page))
    .set('_limit', String(query.pageSize))
    .set('_sort', sort)
    .set('_order', order);

  for (const [stat, {min, max}] of Object.entries(query.ranges)) {
    if (min !== null) {
      params = params.set(`powerstats.${stat}_gte`, String(min));
    }

    if (max !== null) {
      params = params.set(`powerstats.${stat}_lte`, String(max));
    }
  }

  if (query.term.trim().length > 0) {
    params = params.set('search', query.term.trim());
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
  readonly mode$: Observable<ListMode> = this.state$.pipe(map((s) => s.mode));
  readonly loadingMore$: Observable<boolean> = this.state$.pipe(map((s) => s.loadingMore));
  readonly canLoadMore$: Observable<boolean> = this.state$.pipe(map((s) => s.mode === "infinite" && s.status === "loaded" && s.query.page < totalPages(s)))

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
        map(([query]) => ({query, append: isAppend(this.state$.value.mode, query.page)})),
        tap(({query, append}) => this.patch({
          query,
          error: null,
          ...(append ? {loadingMore: true} : {status: 'loading'})
        })),
        switchMap(({query, append}) => this.fetchPage(query, append))
      )
      .subscribe(); 
  }

  applyConfig(config: CatalogConfig): void {
    const modeChanged = this.state$.value.mode !== config.mode;
    const page = config.mode === 'paged' ? config.page : 1;
    const query = this.query$.value;

    const queryChanged =
      query.term !== config.search ||
      query.alignment !== config.alignment ||
      query.sort !== config.sort ||
      !sameRanges(query.ranges, config.ranges) ||
      (config.mode === 'paged' && query.page !== config.page);

    if (modeChanged) {
      this.patch({ mode: config.mode });
    }

    if (modeChanged || queryChanged) {
      this.patchQuery({ term: config.search, alignment: config.alignment, sort: config.sort, ranges: config.ranges, page });
    }
  }

  loadMore(): void {
    const state = this.state$.value;
    const page = this.query$.value.page;

    if (state.mode !== "infinite" || state.loadingMore || state.status === "loading") {
      return;
    }

    if (page >= totalPages(state)) {
      return;
    }

    this.patchQuery({page: page + 1})
  }

  reload(): void {
    if (this.state$.value.mode === "infinite") {
      this.patchQuery({page: 1})
    }

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

  getHeroesByIds(ids: number[]): Observable<Hero[]> {
    if (ids.length === 0) {
      return of([]);
    }

    const params = ids.reduce(
      (acc, id) => acc.append('id', String(id)),
      new HttpParams()
    );

    return this.http.get<Hero[]>(HEROES_URL, { params });
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

  private fetchPage(query: HeroQuery, append: boolean): Observable<unknown> {
    return this.http
      .get<Hero[]>(HEROES_URL, { params: toParams(query), observe: 'response' })
      .pipe(
        tap((res: HttpResponse<Hero[]>) => {
          const page = res.body ?? [];

          this.patch({
            heroes: append ? [...this.state$.value.heroes, ...page] : page,
            total: Number(res.headers.get('X-Total-Count') ?? 0),
            status: 'loaded',
            loadingMore: false,
          });
        }),
        catchError(() => {
          this.patch(
            append
            ? {loadingMore: false, error: 'Could not load more heroes'}
            : { status: 'error', error: 'Could not load heroes.' }
          );
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
