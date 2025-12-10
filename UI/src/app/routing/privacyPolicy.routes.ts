import { Routes } from '@angular/router';
import { PrivacyPolicyComponent } from '../pages/privacyPolicy/privacyPolicy';
import { PrivacyPolicyAdminComponent } from '../pages/privacyPolicy/privacyPolicy-admin';

export const privacyPolicyRoutes: Routes = [
  {
    path: '',
    component: PrivacyPolicyComponent,
  },
  {
    path: 'admin',
    component: PrivacyPolicyAdminComponent,
  },
];
