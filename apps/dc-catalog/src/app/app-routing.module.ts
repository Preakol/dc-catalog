import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HeroListComponent } from './heroes/hero-list/hero-list.component';
import { HeroEditComponent } from './heroes/hero-edit/hero-edit.component';

const routes: Routes = [
  { path: '', component: HeroListComponent },
  { path: 'heroes/:id/edit', component: HeroEditComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}