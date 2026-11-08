import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  OperatorFunction,
  timeInterval,
} from 'rxjs';

import { CartStore } from '../../cart/cart.store';
import { PurchaseState } from '../../cart/cart.model';
import { toPurchaseState } from '../../cart/cart.utils';
import { CompareButtonState } from '../../compare/compare.model';
import { CompareStore } from '../../compare/compare.store';
import { toCompareButtonState } from '../../compare/compare.utils';
import { DATA_SOURCE } from '../data/data-source';
import { HeroCardComponent } from '../hero-card/hero-card.component';
import { HeroFormComponent } from '../hero-form/hero-form.component';
import {
  ALIGNMENT_FILTERS,
  AlignmentFilter,
  ExternalHero,
  Hero,
  HeroFormValue,
} from '../hero.model';
import { HeroSort, RANGE_STATS, RangeStat, Ranges } from '../hero-query';
import { HeroStore } from '../hero.store';
import { LIST_MODES, ListMode, sameRanges, SORT_OPTIONS } from '../hero.state';
import {
  canReset,
  CatalogConfig,
  DEFAULT_CONFIG,
  fromQueryParams,
  resetConfig,
  sameParams,
  toQueryParams,
} from '../hero-url';
import { InViewDirective } from '../in-view.directive';
import { PaginationComponent } from '../pagination/pagination.component';

const TYPING_DEBOUNCE_MS = 300;
const TYPING_BURST_MS = 800;

interface BurstValue<T> {
  value: T;
  replaceUrl: boolean;
}

export interface HeroRow {
  hero: Hero;
  purchase: PurchaseState;
  compare: CompareButtonState;
}

/**
 * Marks values typed in quick succession, so a burst of keystrokes replaces
 * one history entry instead of adding one per debounce.
 */
function withReplaceUrl<T>(): OperatorFunction<T, BurstValue<T>> {
  return (source) =>
    source.pipe(
      timeInterval(),
      map(({ value, interval }, index) => ({
        value,
        replaceUrl: index > 0 && interval < TYPING_BURST_MS,
      })),
    );
}

function integerBound(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;

  return value === null || Number.isInteger(value) ? null : { notInteger: true };
}

function toBound(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100
    ? value
    : null;
}

function rangeOrder(group: AbstractControl): ValidationErrors | null {
  const min = toBound(group.get('min')?.value);
  const max = toBound(group.get('max')?.value);

  return min !== null && max !== null && min > max ? { minAboveMax: true } : null;
}

const BOUND_VALIDATORS = [Validators.min(0), Validators.max(100), integerBound];

@Component({
  selector: 'dc-hero-list',
  imports: [
    HeroCardComponent,
    HeroFormComponent,
    InViewDirective,
    PaginationComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './hero-list.component.html',
  styleUrl: './hero-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroListComponent {
  private readonly store = inject(HeroStore);
  private readonly cart = inject(CartStore);
  private readonly compareStore = inject(CompareStore);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly alignmentFilters = ALIGNMENT_FILTERS;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly listModes = LIST_MODES;
  protected readonly rangeStats = RANGE_STATS;
  protected readonly skeletons = Array.from({ length: 12 }, (_, index) => index);
  protected readonly browserData = inject(DATA_SOURCE) === 'browser';

  protected readonly search = new FormControl(DEFAULT_CONFIG.search, { nonNullable: true });
  protected readonly sortControl = new FormControl<HeroSort>(DEFAULT_CONFIG.sort, {
    nonNullable: true,
  });

  protected readonly filters = this.fb.group({
    strength: this.rangeGroup(),
    intelligence: this.rangeGroup(),
  });

  protected readonly showForm = signal(false);

  protected readonly total = this.store.total;
  protected readonly query = this.store.query;
  protected readonly status = this.store.status;
  protected readonly error = this.store.error;
  protected readonly importing = this.store.importing;
  protected readonly discovering = this.store.discovering;
  protected readonly discovered = this.store.discovered;
  protected readonly discoveredImported = this.store.discoveredImported;
  protected readonly mode = this.store.mode;
  protected readonly loadingMore = this.store.loadingMore;
  protected readonly loadMoreError = this.store.loadMoreError;
  protected readonly canLoadMore = this.store.canLoadMore;
  protected readonly totalPages = this.store.totalPages;

  private readonly queryParams = toSignal(this.route.queryParams, { requireSync: true });

  protected readonly canReset = computed(() => canReset(fromQueryParams(this.queryParams())));

  protected readonly rows = computed((): HeroRow[] => {
    const owned = this.cart.ownedIds();
    const inCart = this.cart.cartIds();
    const selected = this.compareStore.selectedIds();
    const full = this.compareStore.full();

    return this.store.heroes().map((hero) => ({
      hero,
      purchase: toPurchaseState(owned.has(hero.id), inCart.has(hero.id)),
      compare: toCompareButtonState(selected.has(hero.id), full),
    }));
  });

  protected readonly pagination = computed(() => ({
    page: this.query().page,
    totalPages: this.totalPages(),
    mode: this.mode(),
  }));

  constructor() {
    const destroyRef = inject(DestroyRef);

    this.store.startDiscovery();

    effect(() => {
      const params = this.queryParams();
      untracked(() => this.applyUrl(params));
    });

    this.search.valueChanges
      .pipe(
        debounceTime(TYPING_DEBOUNCE_MS),
        distinctUntilChanged(),
        withReplaceUrl(),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(({ value, replaceUrl }) =>
        this.changeConfig({ search: value, page: 1 }, replaceUrl),
      );

    this.sortControl.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((sort) => this.changeConfig({ sort, page: 1 }, false));

    const ranges$: Observable<Ranges> = this.filters.valueChanges.pipe(
      map(() => this.currentRanges()),
    );

    ranges$
      .pipe(
        debounceTime(TYPING_DEBOUNCE_MS),
        filter(() => this.filters.valid),
        withReplaceUrl(),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(({ value, replaceUrl }) =>
        this.changeConfig({ ranges: value, page: 1 }, replaceUrl),
      );

    effect(() => {
      const page = this.query().page;
      const last = this.totalPages();

      if (this.mode() === 'paged' && this.status() === 'loaded' && page > last) {
        untracked(() => this.changeConfig({ page: last }, true));
      }
    });
  }

  protected rangeError(stat: RangeStat): string | null {
    const group = this.filters.controls[stat];

    if (group.valid || group.pristine) {
      return null;
    }

    return group.hasError('minAboveMax')
      ? 'Minimum cannot exceed maximum.'
      : 'Use whole numbers from 0 to 100.';
  }

  protected onAlignment(alignment: AlignmentFilter): void {
    this.changeConfig({ alignment, page: 1 }, false);
  }

  protected onMode(mode: ListMode): void {
    this.changeConfig({ mode, page: 1 }, false);
  }

  protected onPage(page: number): void {
    this.changeConfig({ page }, false);
  }

  protected onLoadMore(): void {
    this.store.loadMore();
  }

  protected onRetry(): void {
    this.store.reload();
  }

  protected onRetryLoadMore(): void {
    this.store.retryLoadMore();
  }

  protected onHeroSubmitted(value: HeroFormValue): void {
    this.store.create(value);
    this.showForm.set(false);
  }

  protected onHeroBuy(hero: Hero): void {
    this.cart.add(hero);
  }

  protected onCompareToggled(hero: Hero): void {
    this.compareStore.toggle(hero);
  }

  protected onHeroDeleted(id: number): void {
    this.store.remove(id);
  }

  protected onImportDiscovered(hero: ExternalHero): void {
    this.store.importHero(hero);
  }

  protected onDiscoverAnother(): void {
    this.store.discoverAnother();
  }

  protected onDismissError(): void {
    this.store.clearError();
  }

  protected onReset(): void {
    this.changeConfig(resetConfig(fromQueryParams(this.route.snapshot.queryParams)), false);
  }

  private rangeGroup() {
    return this.fb.group(
      {
        min: new FormControl<number | null>(null, BOUND_VALIDATORS),
        max: new FormControl<number | null>(null, BOUND_VALIDATORS),
      },
      { validators: rangeOrder },
    );
  }

  private currentRanges(): Ranges {
    const value = this.filters.getRawValue();

    return {
      strength: { min: toBound(value.strength.min), max: toBound(value.strength.max) },
      intelligence: { min: toBound(value.intelligence.min), max: toBound(value.intelligence.max) },
    };
  }

  private applyUrl(params: Params): void {
    const config = fromQueryParams(params);
    const canonical = toQueryParams(config);

    if (!sameParams(params, canonical)) {
      void this.router.navigate([], { queryParams: canonical, replaceUrl: true });
      return;
    }

    if (this.search.value !== config.search) {
      this.search.setValue(config.search, { emitEvent: false });
    }

    if (this.sortControl.value !== config.sort) {
      this.sortControl.setValue(config.sort, { emitEvent: false });
    }

    if (!sameRanges(this.currentRanges(), config.ranges)) {
      this.filters.setValue(config.ranges, { emitEvent: false });
    }

    this.store.applyConfig(config);
  }

  private changeConfig(changes: Partial<CatalogConfig>, replaceUrl: boolean): void {
    const current = fromQueryParams(this.route.snapshot.queryParams);
    const queryParams = toQueryParams({ ...current, ...changes });

    void this.router.navigate([], { queryParams, replaceUrl });
  }
}
