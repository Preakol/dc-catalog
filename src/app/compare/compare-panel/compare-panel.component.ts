import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CompareStore } from '../compare.store';
import { formatIds } from '../compare.utils';

@Component({
  selector: 'dc-compare-panel',
  imports: [RouterLink],
  templateUrl: './compare-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparePanelComponent {
  private readonly compare = inject(CompareStore);

  protected readonly entries = this.compare.entries;
  protected readonly limit = this.compare.limit;
  protected readonly idsParam = computed(() => formatIds(this.compare.ids()));

  protected onRemove(heroId: number): void {
    this.compare.remove(heroId);
  }

  protected onClear(): void {
    this.compare.clear();
  }
}
