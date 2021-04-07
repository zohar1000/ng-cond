import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgCondModule } from 'projects/ng-cond/src/lib/ng-cond.module';


@NgModule({
  declarations: [],
  imports: [
      CommonModule,
      NgCondModule.forChild({ isClearValueOnError: true })
  ],
  exports: [
    NgCondModule
  ]
})
export class SharedModule {}
