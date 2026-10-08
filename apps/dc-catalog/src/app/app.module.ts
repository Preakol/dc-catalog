import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HeroCardComponent } from './heroes/hero-card/hero-card.component';
import { HeroFormComponent } from './heroes/hero-form/hero-form.component';
import { HeroListComponent } from './heroes/hero-list/hero-list.component';
import { PaginationComponent } from './heroes/pagination/pagination.component';
import { AppRoutingModule } from './app-routing.module';
import { HeroEditComponent } from './heroes/hero-edit/hero-edit.component';
import { HeroDetailComponent } from './heroes/hero-detail/hero-detail.component';
import { CartPageComponent } from './cart/cart-page/cart-page.component';
import { MyHeroesComponent } from './cart/my-heroes/my-heroes.component';
import { ComparePanelComponent } from './compare/compare-panel/compare-panel.component';

@NgModule({
  declarations: [
    AppComponent,
    CartPageComponent,
    ComparePanelComponent,
    HeroCardComponent,
    HeroDetailComponent,
    HeroEditComponent,
    HeroFormComponent,
    HeroListComponent,
    MyHeroesComponent,
    PaginationComponent,
  ],
  imports: [AppRoutingModule, BrowserModule, HttpClientModule, ReactiveFormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
