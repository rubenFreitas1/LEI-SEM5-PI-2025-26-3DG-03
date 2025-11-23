
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivationSent } from './activation-sent';
import { ApiService } from '../../services/api.service';
import { PermissionService } from '../../services/permission.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('ActivationSent', () => {
	let component: ActivationSent;
	let fixture: ComponentFixture<ActivationSent>;

	const apiSpy = { get: jasmine.createSpy('get').and.returnValue(of({ isFirstTime: true, email: null })), post: jasmine.createSpy('post').and.returnValue(of({})) };
	const permissionsSpy = { setRole: jasmine.createSpy('setRole'), getRole: jasmine.createSpy('getRole').and.returnValue(null) };
	const routerSpy = { navigate: jasmine.createSpy('navigate') };
	const activatedRouteStub = { snapshot: { queryParamMap: { get: (k: string) => null } } } as any;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ActivationSent],
			providers: [
				{ provide: ApiService, useValue: apiSpy },
				{ provide: PermissionService, useValue: permissionsSpy },
				{ provide: Router, useValue: routerSpy },
				{ provide: ActivatedRoute, useValue: activatedRouteStub }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(ActivationSent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});

