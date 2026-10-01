import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { CartService } from './cart/cart.service';

@Component({
  selector: 'dc-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly title = 'DC Catalog';

  readonly cartCount$: Observable<number> = this.cart.count$;

  constructor(private cart: CartService) {}
}
