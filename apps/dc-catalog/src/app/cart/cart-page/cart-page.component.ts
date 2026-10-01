import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';

import { CartItem, CheckoutStatus } from '../cart.model';
import { CartService } from '../cart.service';
import { PaymentService } from '../payment.service';

@Component({
  selector: 'dc-cart-page',
  templateUrl: './cart-page.component.html',
})
export class CartPageComponent implements OnDestroy {
  readonly items$: Observable<CartItem[]> = this.cart.items$;
  readonly total$: Observable<number> = this.cart.total$;
  readonly status$: Observable<CheckoutStatus> = this.cart.status$;
  readonly error$: Observable<string | null> = this.cart.error$;

  readonly fieldError$: Observable<string | null> = this.payment.fieldError$;
  readonly cardComplete$: Observable<boolean> = this.payment.cardComplete$;

  readonly keyPresent = this.payment.keyPresent;
  readonly scriptLoaded = this.payment.scriptLoaded;
  readonly checkoutAvailable = this.cart.checkoutAvailable;

  constructor(private cart: CartService, private payment: PaymentService) {}

  @ViewChild('cardHost')
  set cardHost(host: ElementRef<HTMLElement> | undefined) {
    if (host === undefined) {
      this.payment.unmount();
      return;
    }

    this.payment.mount(host.nativeElement);
  }

  ngOnDestroy(): void {
    this.payment.unmount();
    this.cart.resetCheckout();
  }

  onRemove(heroId: number): void {
    this.cart.remove(heroId);
  }

  onClear(): void {
    this.cart.clear();
  }

  onDismissError(): void {
    this.cart.dismissError();
  }

  onSubmit(): void {
    this.cart.checkout();
  }

  trackByHeroId(index: number, item: CartItem): number {
    return item.heroId;
  }
}
