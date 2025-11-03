import { Component, computed, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
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


@Component({
  selector: 'app-default-header',
  imports: [ContainerComponent, HeaderTogglerDirective, SidebarToggleDirective, IconDirective, HeaderNavComponent, RouterLink,  NgTemplateOutlet, BreadcrumbRouterComponent, DropdownComponent, DropdownToggleDirective, DropdownMenuDirective, DropdownHeaderDirective, DropdownItemDirective, DropdownDividerDirective, HeaderModule],
  templateUrl: './default-header.html',
  styleUrl: './default-header.css',
})
export class DefaultHeader extends HeaderComponent{
  readonly #colorModeService = inject(ColorModeService);
  readonly colorMode = this.#colorModeService.colorMode;

  readonly colorModes = [
    { name: 'light', text: 'Light', icon: 'cilSun' },
    { name: 'dark', text: 'Dark', icon: 'cilMoon' }
  ];

  readonly icons = computed(() => {
    const currentMode = this.colorMode();
    return this.colorModes.find(mode => mode.name === currentMode)?.icon ?? 'cilSun';
  });

  constructor() {
    super();
  }

  sidebarId = input('sidebar1');


}
