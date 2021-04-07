import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'about', pathMatch: 'full' },
  { path: 'comp1', loadChildren: () => import('./components/comp1/comp1.module').then(m => m.Comp1Module) },
  { path: 'comp2', loadChildren: () => import('./components/comp2/comp2.module').then(m => m.Comp2Module) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
