import { NgModule } from '@angular/core';
import { Comp1Component } from './comp1.component';
import { Comp1RoutingModule } from './comp1-routing.module';
import { SharedModule } from '../../shared/shared/shared.module';

@NgModule({
  declarations: [Comp1Component],
  imports: [
      Comp1RoutingModule,
      SharedModule
  ]
})
export class Comp1Module { }
