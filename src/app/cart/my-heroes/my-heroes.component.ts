import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartStore } from '../cart.store';

@Component({
  selector: 'dc-my-heroes',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './my-heroes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyHeroesComponent {
  protected readonly orders = inject(CartStore).orders;

  protected readonly ownedCount = computed(() =>
    this.orders().reduce((sum, order) => sum + order.items.length, 0),
  );

  protected readonly spent = computed(() =>
    this.orders().reduce((sum, order) => sum + order.total, 0),
  );
}
