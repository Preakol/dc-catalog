import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Hero } from '../heroes/hero.model';
import { COMPARE_LIMIT, CompareEntry } from './compare.model';
import { CompareState, initialCompareState } from './compare.state';
import { loadCompare, saveCompare } from './compare.storage';
import { toCompareEntry } from './compare.utils';

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
    this.persist(this.state$.value.entries.filter((entry) => entry.heroId !== heroId));
  }

  clear(): void {
    this.persist([]);
  }

  replaceWith(entries: CompareEntry[]): void {
    this.persist(entries.slice(0, COMPARE_LIMIT));
  }

  private persist(entries: CompareEntry[]): void {
    saveCompare(entries);
    this.state$.next({ ...this.state$.value, entries });
  }
}
