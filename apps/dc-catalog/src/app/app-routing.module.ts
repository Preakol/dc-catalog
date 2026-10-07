import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HeroListComponent } from './heroes/hero-list/hero-list.component';
import { HeroEditComponent } from './heroes/hero-edit/hero-edit.component';
import { HeroDetailComponent } from './heroes/hero-detail/hero-detail.component';
import { CartPageComponent } from './cart/cart-page/cart-page.component';
import { MyHeroesComponent } from './cart/my-heroes/my-heroes.component';

const routes: Routes = [
  { path: '', component: HeroListComponent },
  { path: 'cart', component: CartPageComponent },
  {
    path: 'compare',
    loadChildren: () =>
      import('./compare/compare.module').then((m) => m.CompareModule),
  },
  { path: 'my-heroes', component: MyHeroesComponent },
  { path: 'heroes/:id', component: HeroDetailComponent },
  { path: 'heroes/:id/edit', component: HeroEditComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}