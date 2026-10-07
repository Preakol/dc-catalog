import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CompareEntry } from '../compare.model';
import { CompareService } from '../compare.service';
import { formatIds } from '../compare.utils';

@Component({
  selector: 'dc-compare-panel',
  templateUrl: './compare-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparePanelComponent {
  readonly entries$: Observable<CompareEntry[]> = this.compare.entries$;
  readonly limit = this.compare.limit;

  readonly idsParam$: Observable<string> = this.compare.ids$.pipe(map(formatIds));

  constructor(private compare: CompareService) {}

  onRemove(heroId: number): void {
    this.compare.remove(heroId);
  }

  onClear(): void {
    this.compare.clear();
  }

  trackByHeroId(index: number, entry: CompareEntry): number {
    return entry.heroId;
  }
}
