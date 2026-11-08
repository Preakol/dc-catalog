import { Routes } from '@angular/router';

import { CartPageComponent } from './cart/cart-page/cart-page.component';
import { MyHeroesComponent } from './cart/my-heroes/my-heroes.component';
import { HeroDetailComponent } from './heroes/hero-detail/hero-detail.component';
import { HeroEditComponent } from './heroes/hero-edit/hero-edit.component';
import { HeroListComponent } from './heroes/hero-list/hero-list.component';

export const routes: Routes = [
  { path: '', component: HeroListComponent, title: 'DC Catalog' },
  { path: 'cart', component: CartPageComponent, title: 'Cart · DC Catalog' },
  {
    path: 'compare',
    loadComponent: () =>
      import('./compare/compare-page/compare-page.component').then((m) => m.ComparePageComponent),
    title: 'Compare · DC Catalog',
  },
  { path: 'my-heroes', component: MyHeroesComponent, title: 'My heroes · DC Catalog' },
  { path: 'heroes/:id', component: HeroDetailComponent, title: 'Hero · DC Catalog' },
  { path: 'heroes/:id/edit', component: HeroEditComponent, title: 'Edit hero · DC Catalog' },
  { path: '**', redirectTo: '' },
];
