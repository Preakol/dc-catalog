import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { CartService } from './cart/cart.service';

@Component({
  selector: 'dc-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly title = 'DC Catalog';

  readonly cartCount$: Observable<number> = this.cart.count$;

  drawerOpen = false;

  constructor(private cart: CartService, private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.closeDrawer());
  }

  openDrawer(): void {
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    this.drawerOpen = false;
  }
}
