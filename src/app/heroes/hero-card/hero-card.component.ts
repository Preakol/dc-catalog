import { CurrencyPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PurchaseState } from '../../cart/cart.model';
import { CompareButtonState } from '../../compare/compare.model';
import { Alignment, Hero } from '../hero.model';
import {
  fullNameOf,
  PLACEHOLDER_IMAGE,
  priceOf,
  raceOf,
  toAlignment,
  toStatEntries,
} from '../hero.utils';

const ALIGNMENT_BADGE: Record<Alignment, string> = {
  good: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40',
  bad: 'bg-rose-500/20 text-rose-300 ring-rose-500/40',
  neutral: 'bg-slate-500/20 text-slate-300 ring-slate-500/40',
};

@Component({
  selector: 'dc-hero-card',
  imports: [CurrencyPipe, NgClass, RouterLink],
  templateUrl: './hero-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroCardComponent {
  readonly hero = input.required<Hero>();
  readonly purchase = input<PurchaseState>('buy');
  readonly compare = input<CompareButtonState>('add');

  readonly deleted = output<number>();
  readonly buy = output<Hero>();
  readonly compareToggled = output<Hero>();

  protected readonly stats = computed(() => toStatEntries(this.hero().powerstats));
  protected readonly imageUrl = computed(() => this.hero().images?.md || PLACEHOLDER_IMAGE);
  protected readonly race = computed(() => raceOf(this.hero()));
  protected readonly fullName = computed(() => fullNameOf(this.hero()));
  protected readonly alignment = computed(() => toAlignment(this.hero().biography?.alignment));
  protected readonly alignmentClass = computed(() => ALIGNMENT_BADGE[this.alignment()]);
  protected readonly price = computed(() => priceOf(this.hero()));
}
