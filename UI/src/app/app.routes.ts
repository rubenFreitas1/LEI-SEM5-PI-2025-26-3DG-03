import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () => import('./layout').then(m => m.DefaultLayout),
    data: { title: 'Home' },
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./routing/dashboard.routes').then((m) => m.routes)
      },
      {
        path: 'qualification',
        loadChildren: () => import('./routing/qualification.routes').then((m) => m.routes)
      }
    ],
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login),
    data: { title: 'Login Page' }
  },

  {
    path: 'v',
    loadComponent: () => import('./components/visualization/visualization').then(m => m.PortVisualizationComponent),
    data: { title: '3D Port Visualization' }
  }
];
