import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith, switchMap, tap } from 'rxjs';

import { Hero } from '../../heroes/hero.model';
import { HeroStore } from '../../heroes/hero.store';
import { CompareReady, CompareView } from '../compare.state';
import { CompareStore } from '../compare.store';
import {
  buildRows,
  missingIds,
  parseIds,
  sortByRequestedIds,
  toCompareEntry,
} from '../compare.utils';

function toView(found: Hero[], ids: number[]): CompareView {
  const heroes = sortByRequestedIds(found, ids);

  if (heroes.length === 0) {
    return { status: 'not-found', requestedIds: ids };
  }

  return { status: 'ready', heroes, missingIds: missingIds(heroes, ids), rows: buildRows(heroes) };
}

@Component({
  selector: 'dc-compare-page',
  imports: [RouterLink],
  templateUrl: './compare-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparePageComponent {
  private readonly heroes = inject(HeroStore);
  private readonly compare = inject(CompareStore);

  private readonly view = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(
      map((params) => parseIds(params.get('ids'))),
      switchMap((ids) => this.load(ids).pipe(startWith<CompareView>({ status: 'loading' }))),
    ),
    { initialValue: { status: 'loading' } satisfies CompareView },
  );

  protected readonly status = computed(() => this.view().status);

  protected readonly ready = computed((): CompareReady | null => {
    const view = this.view();
    return view.status === 'ready' ? view : null;
  });

  protected readonly requestedIds = computed(() => {
    const view = this.view();
    return view.status === 'not-found' ? view.requestedIds : [];
  });

  protected onRemove(heroId: number): void {
    this.compare.remove(heroId);
  }

  private load(ids: number[]): Observable<CompareView> {
    if (ids.length === 0) {
      return of<CompareView>({ status: 'empty' });
    }

    return this.heroes.getHeroesByIds(ids).pipe(
      tap((found) => this.compare.replaceWith(found.map(toCompareEntry))),
      map((found) => toView(found, ids)),
      catchError(() => of<CompareView>({ status: 'error' })),
    );
  }
}
