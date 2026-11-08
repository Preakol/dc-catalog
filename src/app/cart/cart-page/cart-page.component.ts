import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartStore } from '../cart.store';
import { PaymentService } from '../payment.service';

@Component({
  selector: 'dc-cart-page',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPageComponent {
  private readonly cart = inject(CartStore);
  private readonly payment = inject(PaymentService);

  protected readonly items = this.cart.items;
  protected readonly total = this.cart.total;
  protected readonly status = this.cart.status;
  protected readonly error = this.cart.error;
  protected readonly fieldError = this.payment.fieldError;
  protected readonly cardComplete = this.payment.cardComplete;

  protected readonly keyPresent = this.payment.keyPresent;
  protected readonly scriptLoaded = this.payment.scriptLoaded();
  protected readonly checkoutAvailable = this.payment.available();

  private readonly cardHost = viewChild<ElementRef<HTMLElement>>('cardHost');

  constructor() {
    effect(() => {
      const host = this.cardHost();

      if (host === undefined) {
        this.payment.unmount();
      } else {
        this.payment.mount(host.nativeElement);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.payment.unmount();
      this.cart.resetCheckout();
    });
  }

  protected onRemove(heroId: number): void {
    this.cart.remove(heroId);
  }

  protected onClear(): void {
    this.cart.clear();
  }

  protected onDismissError(): void {
    this.cart.dismissError();
  }

  protected onSubmit(): void {
    this.cart.checkout();
  }
}
