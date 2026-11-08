import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Hero } from '../heroes/hero.model';
import { COMPARE_LIMIT, CompareEntry } from './compare.model';
import { loadCompare, saveCompare } from './compare.storage';
import { formatIds, toCompareEntry } from './compare.utils';

const COMPARE_PATH = '/compare';

/** Up to COMPARE_LIMIT heroes picked for comparison, persisted in localStorage. */
@Injectable({ providedIn: 'root' })
export class CompareStore {
  private readonly router = inject(Router);

  private readonly state = signal<CompareEntry[]>(loadCompare().slice(0, COMPARE_LIMIT));

  readonly entries = this.state.asReadonly();
  readonly ids = computed(() => this.state().map((entry) => entry.heroId));
  readonly selectedIds = computed(() => new Set(this.ids()));
  readonly count = computed(() => this.state().length);
  readonly full = computed(() => this.count() >= COMPARE_LIMIT);
  readonly limit = COMPARE_LIMIT;

  add(hero: Hero): void {
    const entries = this.state();

    if (entries.length >= COMPARE_LIMIT || entries.some((entry) => entry.heroId === hero.id)) {
      return;
    }

    this.persist([...entries, toCompareEntry(hero)]);
  }

  toggle(hero: Hero): void {
    if (this.selectedIds().has(hero.id)) {
      this.remove(hero.id);
      return;
    }

    this.add(hero);
  }

  remove(heroId: number): void {
    const entries = this.state().filter((entry) => entry.heroId !== heroId);

    this.persist(entries);
    this.syncUrl(entries.map((entry) => entry.heroId));
  }

  clear(): void {
    this.persist([]);
    this.syncUrl([]);
  }

  replaceWith(entries: CompareEntry[]): void {
    this.persist(entries.slice(0, COMPARE_LIMIT));
  }

  private syncUrl(ids: number[]): void {
    if (this.router.url.split('?')[0] !== COMPARE_PATH) {
      return;
    }

    void this.router.navigate([], { queryParams: { ids: ids.length > 0 ? formatIds(ids) : null } });
  }

  private persist(entries: CompareEntry[]): void {
    saveCompare(entries);
    this.state.set(entries);
  }
}
