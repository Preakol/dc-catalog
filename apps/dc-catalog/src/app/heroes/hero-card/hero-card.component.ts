import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

import { Hero, StatEntry } from '../hero.model';
import {
  PLACEHOLDER_IMAGE,
  fullNameOf,
  hasFullName,
  priceOf,
  raceOf,
  toAlignment,
  toStatEntries,
} from '../hero.utils';

/**
 * Computed here rather than in the template: Angular rejects a slash inside
 * [class.bg-emerald-500/20], which is exactly how Tailwind spells opacity.
 */
const ALIGNMENT_BADGE: Record<string, string> = {
  good: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40',
  bad: 'bg-rose-500/20 text-rose-300 ring-rose-500/40',
  neutral: 'bg-slate-500/20 text-slate-300 ring-slate-500/40',
};

@Component({
  selector: 'dc-hero-card',
  templateUrl: './hero-card.component.html',
})
export class HeroCardComponent implements OnChanges {
  @Input() hero!: Hero;

  @Output() deleted = new EventEmitter<number>();

  @Output() buy = new EventEmitter<Hero>();

  stats: StatEntry[] = [];
  imageUrl = PLACEHOLDER_IMAGE;
  race = '';
  fullName = '';
  showFullName = false;
  alignment = '';
  alignmentClass = '';
  price = 0;

  ngOnChanges(): void {
    this.stats = toStatEntries(this.hero.powerstats);
    this.imageUrl = this.hero.images?.md || PLACEHOLDER_IMAGE;
    this.race = raceOf(this.hero);
    this.fullName = fullNameOf(this.hero);
    this.showFullName = hasFullName(this.hero);
    this.alignment = toAlignment(this.hero.biography?.alignment);
    this.alignmentClass = ALIGNMENT_BADGE[this.alignment];
    this.price = priceOf(this.hero);
  }

  onDeleteClick(): void {
    this.deleted.emit(this.hero.id);
  }

  onBuyClick(): void {
    this.buy.emit(this.hero);
  }
}
