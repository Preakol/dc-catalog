import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable, OperatorFunction, Subject, combineLatest } from 'rxjs';
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
import {
  HeroSort,
  LIST_MODES,
  ListMode,
  RANGE_STATS,
  RangeStat,
  Ranges,
  sameRanges,
  SORT_OPTIONS,
} from '../hero.state';
import { HeroService } from '../hero.service';
import { CartService } from '../../cart/cart.service';
import { PurchaseState } from '../../cart/cart.model';
import { toPurchaseState } from '../../cart/cart.utils';
import { CompareButtonState } from '../../compare/compare.model';
import { CompareService } from '../../compare/compare.service';
import { toCompareButtonState } from '../../compare/compare.utils';
import { canReset, CatalogConfig, DEFAULT_CONFIG, fromQueryParams, resetConfig, sameParams, toQueryParams } from '../hero-url';

const TYPING_DEBOUNCE_MS = 300;
const TYPING_BURST_MS = 800;

interface BurstValue<T> {
  value: T;
  replaceUrl: boolean;
}

const BOUND_VALIDATORS = [Validators.min(0), Validators.max(100), integerBound];

function withReplaceUrl<T>(): OperatorFunction<T, BurstValue<T>> {
  return (source) =>
    source.pipe(
      timeInterval(),
      map(({ value, interval }, index) => ({
        value,
        replaceUrl: index > 0 && interval < TYPING_BURST_MS,
      }))
    );
}

function integerBound(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  return value === null || Number.isInteger(value) ? null : { notInteger: true };
}

function rangeOrder(group: AbstractControl): ValidationErrors | null {
  const min = toBound(group.get('min')?.value);
  const max = toBound(group.get('max')?.value);

  return min !== null && max !== null && min > max ? { minAboveMax: true } : null;
}

function toBound(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100
    ? value
    : null;
}

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
  styleUrls: ['./hero-list.component.css'],
})
export class HeroListComponent implements OnInit, OnDestroy {
  readonly alignmentFilters = ALIGNMENT_FILTERS;
  readonly sortOptions = SORT_OPTIONS;
  readonly listModes = LIST_MODES;
  readonly rangeStats = RANGE_STATS;

  readonly search = new FormControl(DEFAULT_CONFIG.search);
  readonly sortControl = new FormControl(DEFAULT_CONFIG.sort);

  readonly filters: FormGroup = this.fb.group({
      strength: this.fb.group(
        { min: [null, BOUND_VALIDATORS], max: [null, BOUND_VALIDATORS] },
        { validators: rangeOrder }
      ),
      intelligence: this.fb.group(
        { min: [null, BOUND_VALIDATORS], max: [null, BOUND_VALIDATORS] },
        { validators: rangeOrder }
      ),
    });

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

  readonly canReset$: Observable<boolean> = this.route.queryParams.pipe(
    map((params) => canReset(fromQueryParams(params)))
  );

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
    private fb: FormBuilder,
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
        debounceTime(TYPING_DEBOUNCE_MS),
        distinctUntilChanged(),
        withReplaceUrl(),
        takeUntil(this.destroy$)
      )
      .subscribe(({ value, replaceUrl }) =>
        this.changeConfig({ search: value, page: 1 }, replaceUrl)
      );

    const sort$: Observable<HeroSort> = this.sortControl.valueChanges;

    sort$
      .pipe(takeUntil(this.destroy$))
      .subscribe((sort) => this.changeConfig({sort, page: 1}, false));

    const ranges$: Observable<Ranges> = this.filters.valueChanges;

    ranges$
      .pipe(
        debounceTime(TYPING_DEBOUNCE_MS),
        filter(() => this.filters.valid),
        withReplaceUrl(),
        takeUntil(this.destroy$)
      )
      .subscribe(({value, replaceUrl}) =>
        this.changeConfig({ ranges: value, page: 1 }, replaceUrl)
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

  rangeError(stat: RangeStat): string | null {
    const group = this.filters.get(stat);

    if (group === null || group.valid || group.pristine) {
      return null;
    }

    return group.errors?.minAboveMax
      ? 'Minimum cannot exceed maximum.'
      : 'Use whole numbers from 0 to 100.';
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

  onReset(): void {
    this.changeConfig(resetConfig(fromQueryParams(this.route.snapshot.queryParams)), false);
  }

  trackByRow(index: number, row: HeroRow): number {
    return row.hero.id;
  }

  private applyUrl(params: Params): void {
    const config = fromQueryParams(params);
    const canonical = toQueryParams(config);
    const currentRanges: Ranges = this.filters.value;

    if (!sameParams(params, canonical)) {
      this.router.navigate([], { queryParams: canonical, replaceUrl: true });
      return;
    }

    if (this.search.value !== config.search) {
      this.search.setValue(config.search, { emitEvent: false });
    }

    if (this.sortControl.value !== config.sort) {
      this.sortControl.setValue(config.sort, { emitEvent: false });
    }

    if (!sameRanges(currentRanges, config.ranges)) {
      this.filters.setValue(config.ranges, { emitEvent: false });
    }

    this.heroService.applyConfig(config);
  }

  private changeConfig(changes: Partial<CatalogConfig>, replaceUrl: boolean): void {
    const current = fromQueryParams(this.route.snapshot.queryParams);
    const queryParams = toQueryParams({ ...current, ...changes });

    this.router.navigate([], { queryParams, replaceUrl });
  }
}
