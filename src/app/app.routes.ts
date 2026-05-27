import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'aurora' },
  { path: 'aurora', loadComponent: () => import('./aurora/aurora.component').then(m => m.AuroraComponent) },
  { path: 'rainbow', loadComponent: () => import('./rainbow/rainbow.component').then(m => m.RainbowComponent) },
  { path: 'diamond', loadComponent: () => import('./diamond/diamond.component').then(m => m.DiamondComponent) },
];
