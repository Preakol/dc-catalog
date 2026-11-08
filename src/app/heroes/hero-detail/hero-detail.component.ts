import { CurrencyPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map, Observable, of, startWith, switchMap } from 'rxjs';

import { CartStore } from '../../cart/cart.store';
import { toPurchaseState } from '../../cart/cart.utils';
import { CompareStore } from '../../compare/compare.store';
import { toCompareButtonState } from '../../compare/compare.utils';
import { ExternalHeroes } from '../data/external-heroes';
import { toHeroDetail } from '../hero.mapper';
import {
  ExternalHero,
  Hero,
  HeroDetail,
  HeroDetailReady,
  StatComparison,
  StatEntry,
} from '../hero.model';
import { HeroStore } from '../hero.store';
import {
  aliasesOf,
  alterEgosOf,
  isExternal,
  orUnknown,
  PLACEHOLDER_IMAGE,
  priceOf,
  toStatComparison,
  toStatEntries,
  UNKNOWN,
} from '../hero.utils';

@Component({
  selector: 'dc-hero-detail',
  imports: [CurrencyPipe, NgClass, RouterLink],
  templateUrl: './hero-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroDetailComponent {
  /** Route param, bound by withComponentInputBinding(). */
  readonly id = input.required<string>();

  private readonly store = inject(HeroStore);
  private readonly external = inject(ExternalHeroes);
  private readonly cart = inject(CartStore);
  private readonly compareStore = inject(CompareStore);

  private readonly detail = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) => this.load(Number(id)).pipe(startWith<HeroDetail>({ status: 'loading' }))),
    ),
    { initialValue: { status: 'loading' } satisfies HeroDetail },
  );

  protected readonly status = computed(() => this.detail().status);

  protected readonly ready = computed((): HeroDetailReady | null => {
    const detail = this.detail();
    return detail.status === 'ready' ? detail : null;
  });

  protected readonly purchase = computed(() => {
    const ready = this.ready();
    return ready === null
      ? 'buy'
      : toPurchaseState(
          this.cart.ownedIds().has(ready.hero.id),
          this.cart.cartIds().has(ready.hero.id),
        );
  });

  protected readonly compare = computed(() => {
    const ready = this.ready();
    return ready === null
      ? 'add'
      : toCompareButtonState(
          this.compareStore.selectedIds().has(ready.hero.id),
          this.compareStore.full(),
        );
  });

  protected onCompare(hero: Hero): void {
    this.compareStore.toggle(hero);
  }

  protected onBuy(hero: Hero): void {
    this.cart.add(hero);
  }

  protected priceFor(hero: Hero): number {
    return priceOf(hero);
  }

  protected imageOf(ready: HeroDetailReady): string {
    return ready.external?.images.lg || ready.hero.images?.md || PLACEHOLDER_IMAGE;
  }

  protected statsOf(hero: Hero): StatEntry[] {
    return toStatEntries(hero.powerstats);
  }

  protected textOf(value: string | null, replacer: string = UNKNOWN): string {
    return orUnknown(value, replacer);
  }

  protected alterEgosFor(hero: Hero): string {
    return alterEgosOf(hero);
  }

  protected aliasesFor(hero: Hero): string {
    return aliasesOf(hero);
  }

  protected comparisonOf(hero: Hero, external: ExternalHero): StatComparison[] {
    return toStatComparison(hero.powerstats, external.powerstats);
  }

  private load(id: number): Observable<HeroDetail> {
    return this.store.getHero(id).pipe(
      switchMap((hero) => {
        if (hero === undefined) {
          return of<HeroDetail>({ status: 'missing' });
        }

        if (!isExternal(hero)) {
          return of(toHeroDetail(hero, null));
        }

        return this.external
          .get(hero.externalId)
          .pipe(map((external) => toHeroDetail(hero, external)));
      }),
    );
  }
}
