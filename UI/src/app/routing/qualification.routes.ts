import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/qualification/qualification').then(m => m.Qualification),
    data: { $localize: 'Qualification' },
  }
];
