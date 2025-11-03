import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    icon: 'nav-img nav-img-dashboard',
  },
  {
    title: true,
    name: 'Features'
  },
  {
    name: 'Vessel',
    url: '/vessels',
    icon: 'nav-img nav-img-vessel'
  },
  {
    name: 'Docks',
    url: '/docks',
    icon: 'nav-img nav-img-dock'
  },
  {
    name: 'Storage Area',
    icon: 'nav-img nav-img-storage',
    url: '/storage-area'
  },
  {
    name: 'Vessel Visit Notification',
    url: '/vvn',
    icon: 'nav-img nav-img-vvn',
  },
  {
    name: 'Staff',
    url: '/staff',
    icon: 'nav-img nav-img-staff',
  },
  {
    name:'Physical Resource',
    url: '/physical-resources',
    icon: 'nav-img nav-img-physicalResource'
  },
  {
    name: 'Qualification',
    url: '/qualification',
    icon: 'nav-img nav-img-qualification'
  },
  {
    name: 'Shipping Agent',
    url: '/shippin-agent',
    icon: 'nav-img nav-img-shippingAgent',
    children: [
      {
        name: 'Organization',
        url: '/organization',
        icon: 'nav-img nav-img-organization',
      },
      {
        name: 'Representative',
        url: '/representative',
        icon: 'nav-img nav-img-representative'
      }
    ]
  }
];
