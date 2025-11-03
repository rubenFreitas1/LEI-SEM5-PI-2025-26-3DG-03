import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import {
  AvatarModule,
  BadgeModule,
  BreadcrumbModule,
  ButtonGroupModule,
  DropdownModule,
  GridModule,
  HeaderModule,
  NavModule,
  ProgressModule,
  SidebarModule
} from '@coreui/angular';

import {IconModule, IconSetService} from '@coreui/icons-angular';
import { iconSubset } from '../../../icons/icons';
import { DefaultHeader } from './default-header';


describe('DefaultHeader', () => {
  let component: DefaultHeader;
  let fixture: ComponentFixture<DefaultHeader>;
  let iconSetService: IconSetService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridModule, HeaderModule, IconModule, NavModule, BadgeModule, AvatarModule, DropdownModule, BreadcrumbModule, SidebarModule, ProgressModule, ButtonGroupModule, ReactiveFormsModule, DefaultHeader],
      providers: [IconSetService, provideRouter([])]
    })
    .compileComponents();
  });

  beforeEach(() => {
    iconSetService = TestBed.inject(IconSetService);
    iconSetService.icons = { ...iconSubset };

    fixture = TestBed.createComponent(DefaultHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
