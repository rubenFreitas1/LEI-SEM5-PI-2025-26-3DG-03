import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { delay, filter, map, tap } from 'rxjs/operators';

import { ColorModeService } from '@coreui/angular';
import { IconSetService } from '@coreui/icons-angular';
import { iconSubset } from './icons/icons';

import { AuthService } from '@auth0/auth0-angular';
import { ApiService } from './services/api.service';
import { PermissionService } from './services/permission.service';

@Component({
  selector: 'app-root',
  imports:[RouterOutlet],
  template: '<router-outlet />',
})
export class App implements OnInit {
  title = 'Port Management System';

  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #titleService = inject(Title);

  readonly #colorModeService = inject(ColorModeService);
  readonly #iconSetService = inject(IconSetService);

  readonly #auth = inject(AuthService);
  readonly #api = inject(ApiService);
  readonly #permissions = inject(PermissionService);

  private roleLoading = false;

  constructor() {
    this.#titleService.setTitle(this.title);
    this.#iconSetService.icons = { ...iconSubset };
    this.#colorModeService.localStorageItemName.set('compinchas-color-mode');
    this.#colorModeService.eventName.set('ColorSchemeChange');
  }

  ngOnInit(): void {

    this.#auth.getAccessTokenSilently().subscribe(t => {
      try {
        console.log("ACCESS TOKEN:", JSON.parse(atob(t.split('.')[1])));
      } catch { }
    });

    this.#permissions.loadRoleFromStorage();

    this.#auth.isAuthenticated$
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(isAuth => {
        if (isAuth) {
          const savedRole = this.#permissions.getRole();

          if (!savedRole && !this.roleLoading) {
            this.roleLoading = true;
            this.loadRole();
          }
        } else {
          this.#permissions.clearRole();
        }

        console.log("User authenticated?", isAuth, "Role:", this.#permissions.getRole());
      });

  }

  private loadRole() {
    this.#api.get('/SystemUser/MyIsFirstTime').subscribe({
      next: (data: any) => {
        try {
          if (data?.isFirstTime) {
            // Request server to send activation email for the current user
            this.#api.post('/SystemUser/SendActivationEmail', null).subscribe({
              next: () => {
                this.roleLoading = false;
                // Navigate to activation-sent page and include email if provided
                this.#router.navigate(['/activation-sent'], { queryParams: { email: data?.email } });
                // Do NOT call loadUserRole() here because the account remains Deactivated
                // until the user clicks the activation link. The activation page can
                // offer a 'I've activated' button that triggers role reload.
              },
              error: () => {
                this.roleLoading = false;
                this.logoutAlert();
              }
            });
          } else {
            // Not first time → load role normally
            this.loadUserRole();
          }
        } catch (e) {
          this.roleLoading = false;
          this.logoutAlert();
        }
      },
      error: () => {
        this.roleLoading = false;
        this.logoutAlert();
      }
    });
  }

  private loadUserRole() {
    this.#api.get('/SystemUser/MyRole').subscribe({
      next: (data: any) => {
        this.#permissions.setRole(data.role);
        this.roleLoading = false;
      },
      error: (err: any) => {
        this.roleLoading = false;
        // If server forbids access (403) assume the account is Deactivated and
        // redirect to activation-sent. This avoids extra API calls that may
        // themselves fail due to token/claim differences.
        if (err && err.status === 403) {
          try {
            this.#router.navigate(['/activation-sent']);
          } catch { }
          return;
        }

        this.#api.get('/SystemUser/MyIsFirstTime').subscribe({
          next: (data: any) => {
            if (data?.isFirstTime) {
              try { this.#router.navigate(['/activation-sent'], { queryParams: { email: data?.email } }); } catch { }
              return;
            }
            try { alert('Your account does not have permissions to access this system.'); } catch { }
            try { this.#auth.logout(); } catch { }
          },
          error: () => {
            try { alert('Your account does not have permissions to access this system.'); } catch { }
            try { this.#auth.logout(); } catch { }
          }
        });
      }
    });
  }
  private logoutAlert() {
    try {
      alert('Your account does not have permissions to access this system.');
    } catch { }
    try {
      this.#auth.logout();
    } catch { }
  }
}