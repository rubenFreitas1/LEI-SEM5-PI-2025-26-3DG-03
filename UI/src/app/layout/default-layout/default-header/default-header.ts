import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { NgTemplateOutlet, NgClass, DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  BreadcrumbRouterComponent,
  ColorModeService,
  ContainerComponent,
  DropdownComponent,
  DropdownDividerDirective,
  DropdownHeaderDirective,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownToggleDirective,
  HeaderComponent,
  HeaderNavComponent,
  HeaderTogglerDirective,
  SidebarToggleDirective,
  HeaderModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { AuthService } from '../../../auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
import { SystemUserService } from '../../../services/systemUser.service';
import { RepresentativeService } from '../../../services/representative.service';
import { DataRequestService } from '../../../services/dataRequest.service';
import { DataRequestModel } from '../../../models/dataRequest.model';
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-default-header',
  imports: [ContainerComponent, HeaderTogglerDirective, SidebarToggleDirective, IconDirective, HeaderNavComponent, RouterLink,  NgTemplateOutlet, BreadcrumbRouterComponent, DropdownComponent, DropdownToggleDirective, DropdownMenuDirective, DropdownHeaderDirective, DropdownItemDirective, DropdownDividerDirective, HeaderModule,TranslateModule, FormsModule, NgClass, DatePipe],
  templateUrl: './default-header.html',
  styleUrl: './default-header.css',
})
export class DefaultHeader extends HeaderComponent implements OnInit {
  readonly translate = inject(TranslateService);
  readonly #colorModeService = inject(ColorModeService);
  readonly colorMode = this.#colorModeService.colorMode;
  readonly auth0 = inject(AuthService);
  readonly systemUserService = inject(SystemUserService);
  readonly representativeService = inject(RepresentativeService);
  readonly dataRequestService = inject(DataRequestService);

  userName = 'User';
  userEmail = '';
  userRole = '';
  showProfileModal = signal(false);
  showDataRequestModal = signal(false);
  selectedRequestType = signal<string>('');
  requestDetails = signal<string>('');
  requestSubmitting = signal(false);
  requestSuccess = signal(false);
  requestError = signal<string>('');
  userDataRequests = signal<DataRequestModel[]>([]);
  loadingDataRequests = signal(false);

  readonly colorModes = [
    { name: 'light', text: 'SETTINGS.LIGHT', icon: 'cilSun' },
    { name: 'dark', text: 'SETTINGS.DARK', icon: 'cilMoon' }
  ];

  readonly icons = computed(() => {
    const currentMode = this.colorMode();
    return this.colorModes.find(mode => mode.name === currentMode)?.icon ?? 'cilSun';
  });

  // reactive language signal so UI updates when language changes
  readonly language = signal(localStorage.getItem('lang') || (navigator?.language ?? 'en').startsWith('pt') ? 'pt' : 'en');

  readonly currentLanguage = computed(() => this.language());

  readonly currentLanguageLabel = computed(() => (this.currentLanguage() === 'pt' ? 'PT' : 'EN'));

  constructor() {
    super();

    const initial = localStorage.getItem('lang') || this.currentLanguage();
    this.language.set(initial);
    this.translate.setDefaultLang(initial);
    this.translate.use(initial);
  }

  sidebarId = input('sidebar1');

  async ngOnInit() {
    try {
      const user = await firstValueFrom(this.auth0.user());
      if (user) {
        this.userEmail = user.email || '';

        // Buscar role usando o endpoint MyRole
        const roleResponse = await firstValueFrom(this.systemUserService.getMyRole());
        this.userRole = roleResponse.role;

        // Buscar dados baseado na role
        await this.loadUserData();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.userName = 'User';
    }
    document.documentElement.lang = this.currentLanguage();
  }

  logout() {
    this.auth0.logout();
  }

  setLanguage(lang: string) {
    localStorage.setItem('lang', lang);
    this.language.set(lang);
    this.translate.use(lang);

    document.documentElement.lang = lang;
  }

  async openProfileModal() {
    this.showProfileModal.set(true);
    await this.loadUserDataRequests();
  }

  closeProfileModal() {
    this.showProfileModal.set(false);
  }

  async loadUserData() {
    try {
      if (this.userRole === 'Representative') {
        // Buscar dados do Representative - usa campo "name"
        const representative = await firstValueFrom(
          this.representativeService.getRepresentativeByEmail(this.userEmail)
        );
        this.userName = representative.name || this.userEmail;
      } else {
        // Buscar dados do SystemUser - usa campo "username"
        const systemUser = await firstValueFrom(
          this.systemUserService.getSystemUserByEmail(this.userEmail)
        );
        this.userName = systemUser.username || this.userEmail;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Fallback para email se não encontrar
      this.userName = this.userEmail || 'User';
    }
  }

  async loadUserDataRequests() {
    if (!this.userEmail) return;

    this.loadingDataRequests.set(true);
    try {
      const requests = await firstValueFrom(
        this.dataRequestService.getDataRequestsByEmail(this.userEmail)
      );
      this.userDataRequests.set(requests);
    } catch (error) {
      console.error('Error loading data requests:', error);
      this.userDataRequests.set([]);
    } finally {
      this.loadingDataRequests.set(false);
    }
  }

  async downloadUserData() {
    try {
      const user = await firstValueFrom(this.auth0.user());
      let detailedUserData: any = {};

      // Buscar dados detalhados baseado na role
      if (this.userRole === 'Representative') {
        detailedUserData = await firstValueFrom(
          this.representativeService.getRepresentativeByEmail(this.userEmail)
        );
      } else {
        detailedUserData = await firstValueFrom(
          this.systemUserService.getSystemUserByEmail(this.userEmail)
        );
      }

      const dataToDownload = {
        name: this.userName,
        email: this.userEmail,
        role: this.userRole,
        auth0Data: user,
        detailedData: detailedUserData
      };

      const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading user data:', error);
    }
  }

  openDataRequestModal() {
    this.showDataRequestModal.set(true);
    this.selectedRequestType.set('');
    this.requestDetails.set('');
    this.requestSuccess.set(false);
    this.requestError.set('');
  }

  closeDataRequestModal() {
    this.showDataRequestModal.set(false);
    this.selectedRequestType.set('');
    this.requestDetails.set('');
    this.requestSuccess.set(false);
    this.requestError.set('');
  }

  async submitDataRequest() {
    if (!this.selectedRequestType()) {
      this.requestError.set('Please select a request type');
      return;
    }

    this.requestSubmitting.set(true);
    this.requestError.set('');

    try {
      const dataRequest = {
        systemUserEmail: this.userEmail,
        requestType: this.selectedRequestType(),
        details: this.requestDetails() || undefined
      };

      await firstValueFrom(this.dataRequestService.createDataRequest(dataRequest));
      this.requestSuccess.set(true);

      // Recarregar lista de data requests
      await this.loadUserDataRequests();

      // Fechar modal após 2 segundos
      setTimeout(() => {
        this.closeDataRequestModal();
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting data request:', error);
      this.requestError.set(error?.error?.message || 'Failed to submit data request. Please try again.');
    } finally {
      this.requestSubmitting.set(false);
    }
  }


}
