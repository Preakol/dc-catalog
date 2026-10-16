import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable, Subject, combineLatest } from 'rxjs';
import { 
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  takeUntil,
  timeInterval,
} from 'rxjs/operators';

import {
  ALIGNMENT_FILTERS,
  AlignmentFilter,
  ExternalHero,
  Hero,
  HeroFormValue,
} from '../hero.model';
import { LIST_MODES, ListMode } from '../hero.state';
import { HeroService } from '../hero.service';
import { CartService } from '../../cart/cart.service';
import { PurchaseState } from '../../cart/cart.model';
import { toPurchaseState } from '../../cart/cart.utils';
import { CompareButtonState } from '../../compare/compare.model';
import { CompareService } from '../../compare/compare.service';
import { toCompareButtonState } from '../../compare/compare.utils';
import { CatalogConfig, fromQueryParams, sameParams, toQueryParams } from '../hero-url';

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_BURST_MS = 800;

export interface HeroRow {
  hero: Hero;
  purchase: PurchaseState;
  compare: CompareButtonState;
}

export interface PaginationView {
  page: number;
  totalPages: number;
  mode: ListMode;
}

@Component({
  selector: 'dc-hero-list',
  templateUrl: './hero-list.component.html',
})
export class HeroListComponent implements OnInit, OnDestroy {
  readonly alignmentFilters = ALIGNMENT_FILTERS;
  readonly listModes = LIST_MODES;
  readonly search = new FormControl('');

  showForm = false;

  readonly skeletons = Array.from({ length: 12 });

  private readonly heroes$ = this.heroService.heroes$;
  readonly total$ = this.heroService.total$;
  readonly query$ = this.heroService.query$$;
  readonly totalPages$ = this.heroService.totalPages$;
  readonly status$ = this.heroService.status$;
  readonly error$ = this.heroService.error$;
  readonly importing$ = this.heroService.importing$;
  readonly discovering$ = this.heroService.discovering$;
  readonly discovered$ = this.heroService.discovered$;
  readonly discoveredImported$ = this.heroService.discoveredImported$;
  readonly mode$ = this.heroService.mode$;
  readonly loadingMore$ = this.heroService.loadingMore$;
  readonly canLoadMore$ = this.heroService.canLoadMore$;

  readonly rows$: Observable<HeroRow[]> = combineLatest([
    this.heroes$,
    this.cart.ownedIds$,
    this.cart.cartIds$,
    this.compare.selectedIds$,
    this.compare.full$,
  ]).pipe(
    map(([heroes, owned, inCart, selected, full]) =>
      heroes.map((hero) => ({
        hero,
        purchase: toPurchaseState(owned.has(hero.id), inCart.has(hero.id)),
        compare: toCompareButtonState(selected.has(hero.id), full),
      }))
    )
  );

  readonly pagination$: Observable<PaginationView> = combineLatest([
    this.query$,
    this.totalPages$,
    this.mode$,
  ]).pipe(map(([query, totalPages, mode]) => ({ page: query.page, totalPages, mode})));

  private readonly destroy$ = new Subject<void>();

  constructor(
    private heroService: HeroService,
    private cart: CartService,
    private compare: CompareService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => this.applyUrl(params));

    const term$: Observable<string> = this.search.valueChanges;

    term$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        timeInterval(),
        map(({ value, interval }, index) => ({
          term: value,
          replaceUrl: index > 0 && interval < SEARCH_BURST_MS,
        })),
        takeUntil(this.destroy$)
      )
      .subscribe(({ term, replaceUrl }) =>
        this.changeConfig({ search: term, page: 1 }, replaceUrl)
      );

    combineLatest([this.query$, this.totalPages$, this.mode$, this.status$])
      .pipe(
        filter(([, , mode, status]) => mode === 'paged' && status === 'loaded'),
        takeUntil(this.destroy$),
      )
      .subscribe(([query, totalPages]) => {
        if (query.page > totalPages) {
          this.changeConfig({ page: totalPages }, true);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAlignment(alignment: AlignmentFilter): void {
    this.changeConfig({ alignment, page: 1 }, false);
  }

  onMode(mode: ListMode): void {
    this.changeConfig({ mode, page: 1 }, false);
  }

  onPage(page: number): void {
    this.changeConfig({ page }, false);
  }

  onLoadMore(): void {
    this.heroService.loadMore();
  }

  onRetry(): void {
    this.heroService.reload();
  }

  onHeroSubmitted(value: HeroFormValue): void {
    this.heroService.create(value);
    this.showForm = false;
  }

  onHeroBuy(hero: Hero): void {
    this.cart.add(hero);
  }

  onCompareToggled(hero: Hero): void {
    this.compare.toggle(hero);
  }

  onHeroDeleted(id: number): void {
    this.heroService.remove(id);
  }

  onImportDiscovered(hero: ExternalHero): void {
    this.heroService.importHero(hero);
  }

  onDiscoverAnother(): void {
    this.heroService.discoverAnother();
  }

  onDismissError(): void {
    this.heroService.clearError();
  }

  trackByRow(index: number, row: HeroRow): number {
    return row.hero.id;
  }

  private applyUrl(params: Params): void {
    const config = fromQueryParams(params);
    const canonical = toQueryParams(config);

    if (!sameParams(params, canonical)) {
      this.router.navigate([], { queryParams: canonical, replaceUrl: true });
      return;
    }

    if (this.search.value !== config.search) {
      this.search.setValue(config.search, { emitEvent: false });
    }

    this.heroService.applyConfig(config);
  }

  private changeConfig(changes: Partial<CatalogConfig>, replaceUrl: boolean): void {
    const current = fromQueryParams(this.route.snapshot.queryParams);
    const queryParams = toQueryParams({ ...current, ...changes });

    this.router.navigate([], { queryParams, replaceUrl });
  }
}
