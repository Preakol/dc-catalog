import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, of } from 'rxjs';
import { map, shareReplay, startWith, switchMap } from 'rxjs/operators';

import {
  ExternalHero,
  Hero,
  HeroDetail,
  HeroDetailReady,
  StatComparison,
  StatEntry,
} from '../hero.model';
import { toHeroDetail } from '../hero.mapper';
import { HeroService } from '../hero.service';
import {
  PLACEHOLDER_IMAGE,
  isExternal,
  priceOf,
  toStatComparison,
  toStatEntries,
} from '../hero.utils';
import { CartService } from '../../cart/cart.service';

export type PurchaseState = 'buy' | 'in-cart' | 'owned';

function toPurchaseState(owned: boolean, inCart: boolean): PurchaseState {
  if (owned) {
    return 'owned';
  }

  return inCart ? 'in-cart' : 'buy';
}

@Component({
  selector: 'dc-hero-detail',
  templateUrl: './hero-detail.component.html',
})
export class HeroDetailComponent {
  private readonly detail$: Observable<HeroDetail> = this.route.paramMap.pipe(
    switchMap((params) =>
      this.load(Number(params.get('id'))).pipe(
        startWith<HeroDetail>({ status: 'loading' })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly status$: Observable<HeroDetail['status']> = this.detail$.pipe(
    map((detail) => detail.status)
  );

  readonly ready$: Observable<HeroDetailReady | null> = this.detail$.pipe(
    map((detail) => (detail.status === 'ready' ? detail : null))
  );

  readonly purchase$: Observable<PurchaseState> = this.ready$.pipe(
    switchMap((ready) =>
      ready === null
        ? of<PurchaseState>('buy')
        : combineLatest([
            this.cart.owns(ready.hero.id),
            this.cart.inCart(ready.hero.id),
          ]).pipe(map(([owned, inCart]) => toPurchaseState(owned, inCart)))
    )
  );

  constructor(
    private route: ActivatedRoute,
    private heroService: HeroService,
    private cart: CartService
  ) {}

  priceFor(hero: Hero): number {
    return priceOf(hero);
  }

  onBuy(hero: Hero): void {
    this.cart.add(hero);
  }

  imageOf(ready: HeroDetailReady): string {
    return ready.external?.images.lg || ready.hero.images?.md || PLACEHOLDER_IMAGE;
  }

  statsOf(hero: Hero): StatEntry[] {
    return toStatEntries(hero.powerstats);
  }

  comparisonOf(hero: Hero, external: ExternalHero): StatComparison[] {
    return toStatComparison(hero.powerstats, external.powerstats);
  }

  private load(id: number): Observable<HeroDetail> {
    return this.heroService.getHero(id).pipe(
      switchMap((hero) => {
        if (hero === undefined) {
          return of<HeroDetail>({ status: 'missing' });
        }

        if (!isExternal(hero)) {
          return of(toHeroDetail(hero, null));
        }

        return this.heroService
          .getExternalHero(hero.externalId)
          .pipe(map((external) => toHeroDetail(hero, external)));
      })
    );
  }
}
