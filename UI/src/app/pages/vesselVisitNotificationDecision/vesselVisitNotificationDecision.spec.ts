import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { VesselVisitNotificationDecision } from './vesselVisitNotificationDecision';
import { VesselVisitNotificationDecisionService } from '../../services/vesselVisitNotificationDecision.service';
import { VesselVisitNotificationService } from '../../services/vesselVisitNotification.service';
import { DocksService } from '../../services/docks.service';
import { DecisionStatus } from '../../models/vesselVisitNotificationDecision.model';

describe('VesselVisitNotificationDecision', () => {
	let component: VesselVisitNotificationDecision;
	let fixture: ComponentFixture<VesselVisitNotificationDecision>;
	let decisionSpy: jasmine.SpyObj<VesselVisitNotificationDecisionService>;
	let notificationSpy: jasmine.SpyObj<VesselVisitNotificationService>;
	let docksSpy: jasmine.SpyObj<DocksService>;

	beforeEach(async () => {
		decisionSpy = jasmine.createSpyObj('VesselVisitNotificationDecisionService', ['getAllDecisions', 'createDecision']);
		notificationSpy = jasmine.createSpyObj('VesselVisitNotificationService', ['getAllVesselVisitNotifications']);
		docksSpy = jasmine.createSpyObj('DocksService', ['getAllDocks']);

		decisionSpy.getAllDecisions.and.returnValue(of([]));
		decisionSpy.createDecision.and.returnValue(of({ vesselVisitNotificationCode: 'V1' } as any));
		notificationSpy.getAllVesselVisitNotifications.and.returnValue(of([]));
		docksSpy.getAllDocks.and.returnValue(of([]));

		await TestBed.configureTestingModule({
			imports: [VesselVisitNotificationDecision, RouterTestingModule, TranslateModule.forRoot(), HttpClientTestingModule],
			providers: [
				{ provide: VesselVisitNotificationDecisionService, useValue: decisionSpy },
				{ provide: VesselVisitNotificationService, useValue: notificationSpy },
				{ provide: DocksService, useValue: docksSpy }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(VesselVisitNotificationDecision);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('loads decisions on init', () => {
		const mock = [{ id: 1, vesselVisitNotificationCode: 'A1', responseMessage: 'ok', status: DecisionStatus.Approved, officerId: 1 } as any];
		decisionSpy.getAllDecisions.and.returnValue(of(mock));

		component.loadDecisions();

		expect(decisionSpy.getAllDecisions).toHaveBeenCalled();
		expect(component.decisions.length).toBe(1);
		expect(component.filteredDecisions.length).toBe(1);
		expect(component.isLoading).toBeFalse();
	});

	it('handles error when loading decisions', () => {
		decisionSpy.getAllDecisions.and.returnValue(throwError(() => new Error('boom')));

		component.loadDecisions();

		expect(component.isLoading).toBeFalse();
		expect(component.statusMessageType).toBe('error');
	});

	it('search filters and shows no results message', fakeAsync(() => {
		component.decisions = [{ id: 1, vesselVisitNotificationCode: 'CODE1', responseMessage: 'something', status: 'Approved', officerId: 10 } as any];
		component.searchTerm = 'nomatch';
		component.onSearch();
		tick(350);

		expect(component.filteredDecisions.length).toBe(0);
		expect(component.statusMessageType).toBe('error');
	}));

	it('selectDecision toggles selection', () => {
		const d = { id: 5 } as any;
		component.selectDecision(d);
		expect(component.selectedDecision?.id).toBe(5);
		component.selectDecision(d);
		expect(component.selectedDecision).toBeNull();
	});

	it('open create modal and save new decision calls service', fakeAsync(() => {
		component.onCreateNew();
		component.newDecision = { vesselVisitNotificationCode: 'V1', responseMessage: 'ok', status: DecisionStatus.Approved, officerId: 1 } as any;
		component.onSaveNewDecision();
		tick();

		expect(decisionSpy.createDecision).toHaveBeenCalled();
		expect(component.statusMessageType).toBe('success');
	}));

	it('isValidDecision enforces required fields', () => {
		component.newDecision = { vesselVisitNotificationCode: '', responseMessage: '', status: DecisionStatus.Approved, officerId: 0 } as any;
		expect((component as any).isValidDecision()).toBeFalse();
		component.newDecision = { vesselVisitNotificationCode: 'c', responseMessage: 'r', status: DecisionStatus.Approved, officerId: 1 } as any;
		expect((component as any).isValidDecision()).toBeTrue();
	});

	it('getAvailableNotifications filters by Submitted status', () => {
		component.notifications = [{ code: 'n1', visitStatus: 'Submitted' } as any, { code: 'n2', visitStatus: 'Draft' } as any];
		const available = component.getAvailableNotifications();
		expect(available.length).toBe(1);
		expect(available[0].code).toBe('n1');
	});
});

