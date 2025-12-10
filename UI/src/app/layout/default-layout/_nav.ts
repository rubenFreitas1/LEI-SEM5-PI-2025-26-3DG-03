import { INavData } from '@coreui/angular';
import { IExtendedNavData } from './extended-nav-data';

export const navItems: IExtendedNavData[] = [
  {
    name: 'NAV.DASHBOARD',
    url: '/dashboard',
    icon: 'nav-img nav-img-dashboard',
    roles: ['Admin','LogisticOperator', 'PortAuthorityOfficer', 'Representative']
  },
  {
    title: true,
    name: 'NAV.FEATURES',
  },
  {
    name: 'NAV.VESSEL',
    url: '/vessel',
    icon: 'nav-img nav-img-vessel',
    roles: ['Admin','PortAuthorityOfficer'],
    children: [
    {
      name: 'NAV.VESSEL_TYPE',
      url: '/vesselType',
      icon: 'nav-img nav-img-vessel',
      roles: ['Admin','PortAuthorityOfficer']
    },
    {
      name: 'NAV.VESSEL_RECORD',
      url: '/vessel',
      icon: 'nav-img nav-img-vessel',
      roles: ['Admin','PortAuthorityOfficer']
    }
    ]
  },
  {
    name: 'NAV.DOCKS',
    url: '/docks',
    icon: 'nav-img nav-img-dock',
    roles: ['Admin','PortAuthorityOfficer']
  },
  {
    name: 'NAV.STORAGE_AREA',
    icon: 'nav-img nav-img-storage',
    url: '/storageArea',
    roles: ['Admin','PortAuthorityOfficer']
  },
  {
    name: 'NAV.VVN',
    url: '/vvn',
    icon: 'nav-img nav-img-vvn',
    roles: ['Admin','PortAuthorityOfficer', 'Representative'],
    children: [
      {
        name: 'NAV.VVN_CREATE',
        url: '/vvncreate',
        icon: 'nav-img nav-img-vvn',
        roles: ['Admin', 'Representative']
      },
      {
        name: 'NAV.VVN_DECISION',
        url: '/vvndecision',
        icon: 'nav-img nav-img-vvn',
        roles: ['Admin', 'PortAuthorityOfficer']
      }
    ]
  },
  {
    name: 'NAV.STAFF',
    url: '/staff',
    icon: 'nav-img nav-img-staff',
    roles: ['Admin', 'LogisticOperator']
  },
  {
    name:'NAV.PHYSICAL_RESOURCES',
    url: '/physicalResources',
    icon: 'nav-img nav-img-physicalResource',
    roles: ['Admin', 'LogisticOperator']
  },
  {
    name: 'NAV.QUALIFICATION',
    url: '/qualification',
    icon: 'nav-img nav-img-qualification',
    roles: ['Admin', 'LogisticOperator']
  },
  {
    name: 'NAV.SHIPPING_AGENT',
    url: '/shippin-agent',
    icon: 'nav-img nav-img-shippingAgent',
    roles: ['Admin', 'PortAuthorityOfficer'],
    children: [
      {
        name: 'NAV.ORGANIZATION',
        url: '/organization',
        icon: 'nav-img nav-img-organization',
        roles: ['Admin', 'PortAuthorityOfficer']
      },
      {
        name: 'NAV.REPRESENTATIVE',
        url: '/representative',
        icon: 'nav-img nav-img-representative',
        roles: ['Admin', 'PortAuthorityOfficer']
      }
    ]
  },
  {
    name: 'NAV.SCHEDULE',
    url: '/schedule',
    icon: 'nav-img nav-img-schedule',
    roles: ['Admin', 'LogisticOperator']
  },
  {
    name: 'NAV.REBALANCING',
    url: '/rebalancing',
    icon: 'nav-img nav-img-schedule',
    roles: ['Admin', 'PortAuthorityOfficer']
  },
  {
    name: 'NAV.SYSTEM_USER',
    url: '/user',
    icon: 'nav-img nav-img-systemuser',
    roles: ['Admin']
  },
  {
    name: 'NAV.PRIVACY_POLICY',
    url: '/privacy-policy/admin',
    icon: 'nav-img nav-img-qualification',
    roles: ['Admin']
  }
];
