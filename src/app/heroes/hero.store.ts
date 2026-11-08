import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, Subject, switchMap, tap } from 'rxjs';

import { HeroApi } from './data/hero-api';
import { ExternalHeroes } from './data/external-heroes';
import { buildNewHero } from './hero.mapper';
import { ExternalHero, Hero, HeroFormValue } from './hero.model';
import { HeroPage, HeroQuery } from './hero-query';
import { CatalogConfig } from './hero-url';
import { HeroesState, initialState, isAppend, sameRanges, totalPages } from './hero.state';

interface PageRequest {
  query: HeroQuery;
  append: boolean;
}

type Discovery =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; hero: ExternalHero; imported: boolean }
  | { status: 'unavailable' };

/** Catalogue state for the hero list, kept in signals. */
@Injectable({ providedIn: 'root' })
export class HeroStore {
  private readonly api = inject(HeroApi);
  private readonly external = inject(ExternalHeroes);

  private readonly state = signal<HeroesState>(initialState);
  private readonly discovery = signal<Discovery>({ status: 'idle' });

  readonly heroes = computed(() => this.state().heroes);
  readonly total = computed(() => this.state().total);
  readonly query = computed(() => this.state().query);
  readonly totalPages = computed(() => totalPages(this.state()));
  readonly status = computed(() => this.state().status);
  readonly error = computed(() => this.state().error);
  readonly importing = computed(() => this.state().importing);
  readonly mode = computed(() => this.state().mode);
  readonly loadingMore = computed(() => this.state().loadingMore);
  readonly loadMoreError = computed(() => this.state().loadMoreError);
  readonly canLoadMore = computed(() => {
    const state = this.state();
    return (
      state.mode === 'infinite' &&
      state.status === 'loaded' &&
      state.loadMoreError === null &&
      state.query.page < totalPages(state)
    );
  });

  readonly discovered = computed(() => {
    const discovery = this.discovery();
    return discovery.status === 'ready' ? discovery.hero : null;
  });
  readonly discovering = computed(() => this.discovery().status === 'loading');
  readonly discoveredImported = computed(() => {
    const discovery = this.discovery();
    return discovery.status === 'ready' && discovery.imported;
  });

  private readonly pages = new Subject<PageRequest>();
  private readonly draws = new Subject<void>();

  constructor() {
    const destroyRef = inject(DestroyRef);

    this.pages
      .pipe(
        switchMap((request) => this.fetchPage(request)),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe();

    this.draws
      .pipe(
        tap(() => this.discovery.set({ status: 'loading' })),
        switchMap(() => this.external.random()),
        switchMap((hero) => (hero === null ? of(null) : this.withImported(hero))),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((discovery) => this.discovery.set(discovery ?? { status: 'unavailable' }));
  }

  /** Applies the catalogue config read from the URL; does nothing if it is unchanged. */
  applyConfig(config: CatalogConfig): void {
    const { mode, query } = this.state();
    const page = config.mode === 'paged' ? config.page : 1;
    const modeChanged = mode !== config.mode;
    const queryChanged =
      this.state().status === 'idle' ||
      query.term !== config.search ||
      query.alignment !== config.alignment ||
      query.sort !== config.sort ||
      !sameRanges(query.ranges, config.ranges) ||
      (config.mode === 'paged' && query.page !== config.page);

    if (modeChanged) {
      this.patch({ mode: config.mode });
    }

    if (modeChanged || queryChanged) {
      this.load({
        ...query,
        term: config.search,
        alignment: config.alignment,
        sort: config.sort,
        ranges: config.ranges,
        page,
      });
    }
  }

  loadMore(): void {
    if (this.canLoadMore() && !this.loadingMore()) {
      this.load({ ...this.query(), page: this.query().page + 1 });
    }
  }

  retryLoadMore(): void {
    if (this.loadMoreError() !== null) {
      this.load(this.query());
    }
  }

  reload(): void {
    this.load(this.mode() === 'infinite' ? { ...this.query(), page: 1 } : this.query());
  }

  /** Draws the first random hero once per app session; later calls keep it. */
  startDiscovery(): void {
    if (this.discovery().status === 'idle') {
      this.draws.next();
    }
  }

  discoverAnother(): void {
    this.draws.next();
  }

  create(input: HeroFormValue): void {
    this.write(this.api.create(buildNewHero(input)), 'Could not create hero.');
  }

  importHero(hero: ExternalHero): void {
    const { id, ...rest } = hero;

    this.patch({ importing: true });
    this.write(this.api.create({ ...rest, externalId: id }), 'Could not import hero.');
  }

  update(hero: Hero): void {
    this.write(this.api.update(hero), 'Could not save hero.');
  }

  /** Heroes that exist among `ids`; errors are passed on to the caller. */
  getHeroesByIds(ids: readonly number[]): Observable<Hero[]> {
    return this.api.getMany(ids);
  }

  /** Emits `undefined` when the hero does not exist or cannot be loaded. */
  getHero(id: number): Observable<Hero | undefined> {
    return this.api.get(id).pipe(catchError(() => of(undefined)));
  }

  remove(id: number): void {
    this.write(this.api.remove(id), 'Could not delete hero.');
  }

  clearError(): void {
    if (this.error() !== null) {
      this.patch({ error: null });
    }
  }

  private load(query: HeroQuery): void {
    const append = isAppend(this.mode(), query.page);

    this.patch({
      query,
      error: null,
      loadMoreError: null,
      ...(append ? { loadingMore: true } : { status: 'loading', loadingMore: false }),
    });
    this.pages.next({ query, append });
  }

  private fetchPage({ query, append }: PageRequest): Observable<unknown> {
    return this.api.list(query).pipe(
      tap((page: HeroPage) =>
        this.patch({
          heroes: append ? [...this.heroes(), ...page.heroes] : page.heroes,
          total: page.total,
          status: 'loaded',
          loadingMore: false,
        }),
      ),
      catchError(() => {
        this.patch(
          append
            ? { loadingMore: false, loadMoreError: 'Could not load more heroes.' }
            : { status: 'error', loadingMore: false, error: 'Could not load heroes.' },
        );
        return of(null);
      }),
    );
  }

  private withImported(hero: ExternalHero): Observable<Discovery> {
    return this.api.existsByExternalId(hero.id).pipe(
      catchError(() => of(false)),
      map((imported): Discovery => ({ status: 'ready', hero, imported })),
    );
  }

  private refreshDiscoveredImported(): void {
    const hero = this.discovered();

    if (hero !== null) {
      this.withImported(hero).subscribe((discovery) => this.discovery.set(discovery));
    }
  }

  private write(request$: Observable<unknown>, errorMessage: string): void {
    request$.subscribe({
      next: () => {
        this.patch({ importing: false });
        this.reload();
        this.refreshDiscoveredImported();
      },
      error: () => this.patch({ importing: false, error: errorMessage }),
    });
  }

  private patch(changes: Partial<HeroesState>): void {
    this.state.update((state) => ({ ...state, ...changes }));
  }
}
