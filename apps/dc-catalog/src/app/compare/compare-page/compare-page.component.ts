import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

import { Hero } from '../../heroes/hero.model';
import { HeroService } from '../../heroes/hero.service';
import { CompareReady, CompareStatus, CompareView } from '../compare.state';
import { CompareService } from '../compare.service';
import {
  buildRows,
  formatIds,
  missingIds,
  sortByRequestedIds,
  parseIds,
  toCompareEntry,
} from '../compare.utils';

@Component({
  selector: 'dc-compare-page',
  templateUrl: './compare-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparePageComponent {
  private readonly view$: Observable<CompareView> = this.route.queryParamMap.pipe(
    map((params) => parseIds(params.get('ids'))),
    switchMap((ids) =>
      this.load(ids).pipe(startWith<CompareView>({ status: 'loading' }))
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly status$: Observable<CompareStatus> = this.view$.pipe(
    map((view) => view.status)
  );

  readonly ready$: Observable<CompareReady | null> = this.view$.pipe(
    map((view) => (view.status === 'ready' ? view : null))
  );

  readonly requestedIds$: Observable<number[]> = this.view$.pipe(
    map((view) => (view.status === 'not-found' ? view.requestedIds : []))
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private heroService: HeroService,
    private compare: CompareService
  ) {}

  onRemove(heroes: Hero[], heroId: number): void {
    const remaining = heroes.map((hero) => hero.id).filter((id) => id !== heroId);

    this.compare.remove(heroId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ids: remaining.length > 0 ? formatIds(remaining) : null },
    });
  }

  trackByHeroId(index: number, hero: Hero): number {
    return hero.id;
  }

  trackByLabel(index: number, row: { label: string }): string {
    return row.label;
  }

  private load(ids: number[]): Observable<CompareView> {
    if (ids.length === 0) {
      return of<CompareView>({ status: 'empty' });
    }

    return this.heroService.getHeroesByIds(ids).pipe(
      tap((found) => this.compare.replaceWith(found.map(toCompareEntry))),
      map((found) => this.toView(found, ids)),
      catchError(() => of<CompareView>({ status: 'error' }))
    );
  }

  private toView(found: Hero[], ids: number[]): CompareView {
    const heroes = sortByRequestedIds(found, ids);

    if (heroes.length === 0) {
      return { status: 'not-found', requestedIds: ids };
    }

    return {
      status: 'ready',
      heroes,
      missingIds: missingIds(heroes, ids),
      rows: buildRows(heroes),
    };
  }
}
