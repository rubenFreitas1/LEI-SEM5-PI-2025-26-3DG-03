import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';
import { PermissionService } from '../../services/permission.service';
import { PrivacyPolicyService, PrivacyPolicyDTO } from '../../services/privacyPolicy.service';
import { PrivacyPolicyModalComponent } from '../../components/privacy-policy-modal/privacy-policy-modal';
import { filterNavItems } from './_nav_filter';
import {
  ContainerComponent,
  ShadowOnScrollDirective,
  SidebarBrandComponent,
  SidebarComponent,
  SidebarFooterComponent,
  SidebarHeaderComponent,
  SidebarNavComponent,
  SidebarToggleDirective,
  SidebarTogglerDirective
} from '@coreui/angular';
import {DefaultFooter, DefaultHeader} from './'
import { navItems } from './_nav';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

function isOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

@Component({
  selector: 'app-default-layout',
  templateUrl: './default-layout.html',
  styleUrls: ['./default-layout.scss'],
  imports: [
    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBrandComponent,
    SidebarNavComponent,
    SidebarFooterComponent,
    SidebarToggleDirective,
    SidebarTogglerDirective,
    ContainerComponent,
    DefaultFooter,
    DefaultHeader,
    NgScrollbar,
    RouterOutlet,
    RouterLink,
    ShadowOnScrollDirective,
    TranslateModule,
    PrivacyPolicyModalComponent
  ]
})
export class DefaultLayout {
  public filteredNav: any[] = [];
  public showPrivacyModal: boolean = false;
  public privacyPolicy: PrivacyPolicyDTO | null = null;

  constructor(
    private permissions: PermissionService,
    private translate: TranslateService,
    private privacyPolicyService: PrivacyPolicyService
  ) {}

  ngOnInit(): void {
    this.permissions.loadRoleFromStorage().then(() => {
      // compute filtered nav and translate labels
      const computeAndTranslate = () => {
        const filtered = filterNavItems(navItems, this.permissions);
        this.filteredNav = this.translateNav(filtered);
      };

      computeAndTranslate();

      this.permissions.roleChanges().subscribe(() => {
        computeAndTranslate();
      });

      // re-translate when language changes
      this.translate.onLangChange.subscribe(() => {
        computeAndTranslate();
      });

      // Check for privacy policy updates
      this.checkPrivacyPolicyUpdate();
    });
  }

  private translateNav(items: any[]): any[] {
    return items.map(item => ({
      ...item,
      name: this.translate.instant(item.name),
      children: item.children ? this.translateNav(item.children) : undefined
    }));
  }

  private checkPrivacyPolicyUpdate(): void {
    console.log('[Privacy Policy] Checking for updates...');
    this.privacyPolicyService.checkPrivacyPolicyUpdate().subscribe({
      next: (response) => {
        console.log('[Privacy Policy] Response:', response);
        console.log('[Privacy Policy] hasNewPolicy:', response.hasNewPolicy);
        console.log('[Privacy Policy] currentPolicy:', response.currentPolicy);
        if (response.hasNewPolicy && response.currentPolicy) {
          console.log('[Privacy Policy] New policy detected, showing modal');
          this.privacyPolicy = response.currentPolicy;
          this.showPrivacyModal = true;
          console.log('[Privacy Policy] showPrivacyModal:', this.showPrivacyModal);
          console.log('[Privacy Policy] privacyPolicy:', this.privacyPolicy);
        } else {
          console.log('[Privacy Policy] No new policy to accept');
        }
      },
      error: (err) => {
        console.error('[Privacy Policy] Error checking privacy policy update:', err);
      }
    });
  }

  onAcceptPrivacyPolicy(): void {
    console.log('[Privacy Policy] User accepting policy...');
    this.privacyPolicyService.acceptPrivacyPolicy().subscribe({
      next: (response) => {
        console.log('[Privacy Policy] Policy accepted successfully:', response);
        this.showPrivacyModal = false;
      },
      error: (err) => {
        console.error('[Privacy Policy] Error accepting privacy policy:', err);
        // Still close the modal even if there's an error
        this.showPrivacyModal = false;
      }
    });
  }
}
