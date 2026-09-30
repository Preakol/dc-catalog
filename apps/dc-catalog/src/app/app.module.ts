import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HeroCardComponent } from './heroes/hero-card/hero-card.component';
import { HeroFormComponent } from './heroes/hero-form/hero-form.component';
import { HeroListComponent } from './heroes/hero-list/hero-list.component';
import { AppRoutingModule } from './app-routing.module';
import { HeroEditComponent } from './heroes/hero-edit/hero-edit.component';
import { HeroDetailComponent } from './heroes/hero-detail/hero-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    HeroCardComponent,
    HeroDetailComponent,
    HeroEditComponent,
    HeroFormComponent,
    HeroListComponent,
  ],
  imports: [AppRoutingModule, BrowserModule, HttpClientModule, ReactiveFormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
