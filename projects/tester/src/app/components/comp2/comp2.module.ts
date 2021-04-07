import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Comp2Component } from './comp2.component';
import { Comp2RoutingModule } from './comp2-routing.module';

@NgModule({
  declarations: [Comp2Component],
  imports: [
    CommonModule,
    Comp2RoutingModule
  ]
})
export class Comp2Module { }
