import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartStore } from '../cart.store';

@Component({
  selector: 'dc-cart-drawer',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onClose()' },
})
export class CartDrawerComponent {
  readonly open = input(false);
  readonly closed = output<void>();

  private readonly cart = inject(CartStore);

  protected readonly items = this.cart.items;
  protected readonly total = this.cart.total;

  protected onClose(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }

  protected onRemove(heroId: number): void {
    this.cart.remove(heroId);
  }

  protected onClear(): void {
    this.cart.clear();
  }
}
