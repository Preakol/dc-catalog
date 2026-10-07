import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ComparePageComponent } from './compare-page/compare-page.component';

const routes: Routes = [{ path: '', component: ComparePageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CompareRoutingModule {}
