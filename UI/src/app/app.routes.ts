import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () => import('./layout').then(m => m.DefaultLayout),
    canActivate: [authGuard],
    data: { title: 'Dashboard'},
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./routing/dashboard.routes').then((m) => m.routes)
      },
      {
        path: 'qualification',
        data: { title: 'Qualification' , breadcrumb: 'Qualification'},
        loadChildren: () => import('./routing/qualification.routes').then((m) => m.routes)
      },
      {
        path: 'physicalResources',
        data: { title: 'Physical Resources', breadcrumb: 'Physical Resources'},
        loadChildren: () => import('./routing/physicalResources.routes').then((m) => m.routes)
      },
      {
        path: 'docks',
        data: { title: 'Docks', breadcrumb: 'Docks' },
        loadChildren: () => import('./routing/docks.routes').then((m) => m.routes)
      },
      {
        path: 'staff',
        data: { title: 'Staff', breadcrumb: 'Staff' },
        loadChildren: () => import('./routing/staff.routes').then((m) => m.routes)
      },
      {
        path: 'storageArea',
        data: { title: 'Storage Area', breadcrumb: 'Storage Area' },
        loadChildren: () => import('./routing/storageArea.routes').then((m) => m.routes)
      },
      {
        path: 'vesselType',
        data: { title: 'Vessel Type', breadcrumb: 'Vessel Type'},
        loadChildren: () => import('./routing/vesselType.routes').then((m) => m.routes)
      },
      {
        path: 'vessel',
        data: { title: 'Vessel', breadcrumb: 'Vessel'},
        loadChildren: () => import('./routing/vessel.routes').then((m) => m.routes)
      },
      {
        path: 'organization',
        data: { title: 'Organization', breadcrumb: 'Organization'},
        loadChildren: () => import('./routing/organization.routes').then((m) => m.routes)
      },
      {
        path: 'representative',
        data: { title: 'Representative', breadcrumb: 'Representative'},
        loadChildren: () => import('./routing/representative.routes').then((m) => m.routes)
      },
      {
        path: 'vvncreate',
        data: { title: 'Vessel Visit Notification', breadcrumb: 'Vessel Visit Notification' },
        loadChildren: () => import('./routing/vesselVisitNotification.routes').then((m) => m.routes)
      },
      {
        path: 'vvndecision',
        data: { title: 'Vessel Visit Notification Decision', breadcrumb: 'Decision' },
        loadChildren: () => import('./routing/vesselVisitNotificationDecision.routes').then((m) => m.routes)
      },
      {
        path: 'schedule',
        data: { title: 'Schedule', breadcrumb: 'Schedule' },
        loadChildren: () => import('./routing/schedule.routes').then((m) => m.routes)
      },
      {
        path: 'rebalancing',
        data: { title: 'Rebalancing', breadcrumb: 'Rebalancing' },
        loadChildren: () => import('./routing/rebalancing.routes').then((m) => m.routes)
      },
      {
        path: 'user',
        data: { title: 'System User', breadcrumb: 'System User'},
        loadChildren: () => import('./routing/systemUser.routes').then((m) => m.routes)
      }
      ,
      {
        path: 'privacy-policy',
        data: { title: 'Privacy Policy', breadcrumb: 'Privacy Policy' },
        loadChildren: () => import('./routing/privacyPolicy.routes').then((m) => m.privacyPolicyRoutes)
      }
    ],
  },
  {
    path: 'activation-sent',
    loadComponent: () => import('./pages/activation-sent/activation-sent').then(m => m.ActivationSent),
    data: { title: 'Activation Sent' }
  },
  {
    path: 'v',
    loadComponent: () => import('./components/visualization/visualization').then(m => m.PortVisualizationComponent),
    data: { title: '3D Port Visualization' }
  }
  ,
  {
    path: 'unauthorized',
    loadComponent: () => import('./pages/unauthorized/unauthorized').then(m => m.Unauthorized),
    data: { title: 'Unauthorized' }
  },

];
