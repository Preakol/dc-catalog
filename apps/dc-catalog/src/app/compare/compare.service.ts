import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Hero } from '../heroes/hero.model';
import { COMPARE_LIMIT, CompareEntry } from './compare.model';
import { CompareState, initialCompareState } from './compare.state';
import { loadCompare, saveCompare } from './compare.storage';
import { formatIds, toCompareEntry } from './compare.utils';

const COMPARE_PATH = '/compare';

@Injectable({ providedIn: 'root' })
export class CompareService {
  private readonly state$ = new BehaviorSubject<CompareState>({
    ...initialCompareState,
    entries: loadCompare().slice(0, COMPARE_LIMIT),
  });

  readonly entries$: Observable<CompareEntry[]> = this.state$.pipe(map((s) => s.entries));

  readonly ids$: Observable<number[]> = this.entries$.pipe(
    map((entries) => entries.map((entry) => entry.heroId))
  );

  readonly selectedIds$: Observable<Set<number>> = this.ids$.pipe(map((ids) => new Set(ids)));

  readonly count$: Observable<number> = this.entries$.pipe(map((entries) => entries.length));

  readonly full$: Observable<boolean> = this.count$.pipe(
    map((count) => count >= COMPARE_LIMIT)
  );

  readonly limit = COMPARE_LIMIT;

  constructor(private router: Router) {}

  add(hero: Hero): void {
    const { entries } = this.state$.value;

    if (entries.length >= COMPARE_LIMIT || entries.some((e) => e.heroId === hero.id)) {
      return;
    }

    this.persist([...entries, toCompareEntry(hero)]);
  }

  toggle(hero: Hero): void {
    const selected = this.state$.value.entries.some((e) => e.heroId === hero.id);

    if (selected) {
      this.remove(hero.id);
      return;
    }

    this.add(hero);
  }

  remove(heroId: number): void {
    const entries = this.state$.value.entries.filter((entry) => entry.heroId !== heroId);

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

    this.router.navigate([], {
      queryParams: { ids: ids.length > 0 ? formatIds(ids) : null },
    });
  }

  private persist(entries: CompareEntry[]): void {
    saveCompare(entries);
    this.state$.next({ ...this.state$.value, entries });
  }
}
