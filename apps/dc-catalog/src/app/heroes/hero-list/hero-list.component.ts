import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, Subject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';

import {
  ALIGNMENT_FILTERS,
  AlignmentFilter,
  ExternalHero,
  Hero,
  HeroFormValue,
} from '../hero.model';
import { HeroService } from '../hero.service';
import { CartService } from '../../cart/cart.service';
import { PurchaseState } from '../../cart/cart.model';
import { toPurchaseState } from '../../cart/cart.utils';
import { CompareButtonState } from '../../compare/compare.model';
import { CompareService } from '../../compare/compare.service';
import { toCompareButtonState } from '../../compare/compare.utils';

export interface HeroRow {
  hero: Hero;
  purchase: PurchaseState;
  compare: CompareButtonState;
}

@Component({
  selector: 'dc-hero-list',
  templateUrl: './hero-list.component.html',
})
export class HeroListComponent implements OnInit, OnDestroy {
  readonly alignmentFilters = ALIGNMENT_FILTERS;
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

  private readonly destroy$ = new Subject<void>();

  constructor(
    private heroService: HeroService,
    private cart: CartService,
    private compare: CompareService
  ) {}

  ngOnInit(): void {
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term: string) => this.heroService.setSearch(term));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAlignment(alignment: AlignmentFilter): void {
    this.heroService.setAlignment(alignment);
  }

  onPage(page: number): void {
    this.heroService.goToPage(page);
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
}
