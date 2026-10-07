import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ComparePageComponent } from './compare-page/compare-page.component';
import { CompareRoutingModule } from './compare-routing.module';

@NgModule({
  declarations: [ComparePageComponent],
  imports: [CommonModule, CompareRoutingModule],
})
export class CompareModule {}
