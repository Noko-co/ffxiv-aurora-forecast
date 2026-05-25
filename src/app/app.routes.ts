import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'aurora' },
  { path: 'aurora', loadComponent: () => import('./aurora/aurora.component').then(m => m.AuroraComponent) },
];
