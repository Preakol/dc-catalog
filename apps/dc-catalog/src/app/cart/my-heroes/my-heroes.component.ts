import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Order, OrderItem } from '../cart.model';
import { CartService } from '../cart.service';

@Component({
  selector: 'dc-my-heroes',
  templateUrl: './my-heroes.component.html',
})
export class MyHeroesComponent {
  readonly orders$: Observable<Order[]> = this.cart.orders$;

  readonly ownedCount$: Observable<number> = this.orders$.pipe(
    map((orders) => orders.reduce((sum, order) => sum + order.items.length, 0))
  );

  readonly spent$: Observable<number> = this.orders$.pipe(
    map((orders) => orders.reduce((sum, order) => sum + order.total, 0))
  );

  constructor(private cart: CartService) {}

  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }

  trackByHeroId(index: number, item: OrderItem): number {
    return item.heroId;
  }
}
