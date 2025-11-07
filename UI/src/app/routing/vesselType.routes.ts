import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/vesselType/vesselType').then(m => m.VesselType),
    data: { $localize: 'vesselType' },
  }
];
