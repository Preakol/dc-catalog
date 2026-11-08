import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { CartDrawerComponent } from './cart/cart-drawer/cart-drawer.component';
import { CartStore } from './cart/cart.store';
import { ComparePanelComponent } from './compare/compare-panel/compare-panel.component';
import { BrowserHeroApi } from './heroes/data/browser-hero-api';
import { HeroStore } from './heroes/hero.store';

@Component({
  selector: 'dc-root',
  imports: [CartDrawerComponent, ComparePanelComponent, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly heroes = inject(HeroStore);
  private readonly demoData = inject(BrowserHeroApi, { optional: true });

  protected readonly title = 'DC Catalog';
  protected readonly cartCount = inject(CartStore).count;
  protected readonly drawerOpen = signal(false);
  protected readonly demoMode = this.demoData !== null;
  protected readonly resetting = signal(false);
  protected readonly resetFailed = signal(false);

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.drawerOpen.set(false));
  }

  protected openDrawer(): void {
    this.drawerOpen.set(true);
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  protected resetDemoData(): void {
    if (this.demoData === null) {
      return;
    }

    this.resetting.set(true);
    this.resetFailed.set(false);
    this.demoData.reset().subscribe({
      next: () => {
        this.resetting.set(false);
        this.heroes.reload();
      },
      error: () => {
        this.resetting.set(false);
        this.resetFailed.set(true);
      },
    });
  }
}
