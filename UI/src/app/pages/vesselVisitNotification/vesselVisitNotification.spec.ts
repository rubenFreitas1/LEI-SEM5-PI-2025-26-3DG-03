import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { VesselVisitNotification } from './vesselVisitNotification';
import { VesselVisitNotificationService } from '../../services/vesselVisitNotification.service';
import { VesselService } from '../../services/vessel.service';
import { RepresentativeService } from '../../services/representative.service';
import { CrewRank, CargoType } from '../../models/vesselVisitNotification.model';

describe('VesselVisitNotification', () => {
  let component: VesselVisitNotification;
  let fixture: ComponentFixture<VesselVisitNotification>;
  let vvnServiceSpy: jasmine.SpyObj<VesselVisitNotificationService>;
  let vesselSpy: jasmine.SpyObj<VesselService>;
  let repSpy: jasmine.SpyObj<RepresentativeService>;

  beforeEach(async () => {
    vvnServiceSpy = jasmine.createSpyObj('VesselVisitNotificationService', ['getAllVesselVisitNotifications', 'createVesselVisitNotification', 'updateVesselVisitNotification']);
    vesselSpy = jasmine.createSpyObj('VesselService', ['getAllVesselRecords']);
    repSpy = jasmine.createSpyObj('RepresentativeService', ['getAllRepresentatives']);

    vvnServiceSpy.getAllVesselVisitNotifications.and.returnValue(of([]));
    vvnServiceSpy.createVesselVisitNotification.and.returnValue(of({ code: 'C1' } as any));
    vvnServiceSpy.updateVesselVisitNotification.and.returnValue(of({} as any));
    vesselSpy.getAllVesselRecords.and.returnValue(of([]));
    repSpy.getAllRepresentatives.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [VesselVisitNotification, RouterTestingModule, TranslateModule.forRoot(), HttpClientTestingModule],
      providers: [
        { provide: VesselVisitNotificationService, useValue: vvnServiceSpy },
        { provide: VesselService, useValue: vesselSpy },
        { provide: RepresentativeService, useValue: repSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VesselVisitNotification);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads vessel visit notifications on success', () => {
    const mock = [{ id: 1, code: 'X1' } as any];
    vvnServiceSpy.getAllVesselVisitNotifications.and.returnValue(of(mock));

    component.loadVesselVisitNotifications();

    expect(vvnServiceSpy.getAllVesselVisitNotifications).toHaveBeenCalled();
    expect(component.vesselVisitNotifications.length).toBe(1);
    expect(component.filteredNotifications.length).toBe(1);
    expect(component.isLoading).toBeFalse();
  });

  it('handles error when loading notifications', () => {
    vvnServiceSpy.getAllVesselVisitNotifications.and.returnValue(throwError(() => new Error('Load error')));

    component.loadVesselVisitNotifications();

    expect(component.isLoading).toBeFalse();
    expect(component.statusMessageType).toBe('error');
  });

  it('loads vessels and representatives', () => {
    vesselSpy.getAllVesselRecords.and.returnValue(of([{ imoNumber: 'IMO1' } as any]));
    repSpy.getAllRepresentatives.and.returnValue(of([{ id: 2, name: 'R' } as any]));

    (component as any).loadVessels();
    (component as any).loadRepresentatives();

    expect(vesselSpy.getAllVesselRecords).toHaveBeenCalled();
    expect(repSpy.getAllRepresentatives).toHaveBeenCalled();
    expect(component.vessels.length).toBe(1);
    expect(component.representatives.length).toBe(1);
  });

  it('addCrewMember adds valid member and resets newCrewMember', () => {
    component.newCrewMember = { name: 'Captain', citizenID: 'C1', rank: CrewRank.Captain, nationality: 'PT' } as any;
    component.additionalCrewMembers = [];

    component.addCrewMember();

    expect(component.additionalCrewMembers.length).toBe(1);
    expect(component.newCrewMember.name).toBe('');
  });

  it('addManifestEntry creates manifest and entry', () => {
    component.newManifestEntry = { containerNumber: 'CONT1', row: 1, tier: 1, bay: 1, storageAreaCode: 'S1' } as any;
    component.cargoManifests = [];

    component.addManifestEntry();

    expect(component.cargoManifests.length).toBe(1);
    expect(component.getManifestEntries(component.currentManifestType).length).toBe(1);
  });

  it('isValidNotification requires Captain (and SafetyOfficer for Hazardous)', () => {
    // Container requires captain only
    component.newNotification = { vesselIMO: 'IMO1', representativeCitizenID: 'R1', eta: new Date(), etd: new Date(), cargoType: CargoType.Container, volume: 1 } as any;
    component.additionalCrewMembers = [{ name: 'C', citizenID: 'c', rank: CrewRank.Captain, nationality: 'PT' } as any];
    expect((component as any).isValidNotification()).toBeTrue();

    // Hazardous requires captain and safety officer
    component.newNotification.cargoType = CargoType.Hazardous as any;
    component.additionalCrewMembers = [ { name: 'C', citizenID: 'c', rank: CrewRank.Captain } as any ];
    expect((component as any).isValidNotification()).toBeFalse();
    component.additionalCrewMembers.push({ name: 'S', citizenID: 's', rank: CrewRank.SafetyOfficer } as any);
    expect((component as any).isValidNotification()).toBeTrue();
  });

  it('onSaveNewNotification validates and calls createVesselVisitNotification when valid', fakeAsync(() => {
    component.newNotification = { vesselIMO: 'IMO1', representativeCitizenID: 'R1', eta: new Date(), etd: new Date(), cargoType: CargoType.Container, volume: 1 } as any;
    component.additionalCrewMembers = [{ name: 'C', citizenID: 'c', rank: CrewRank.Captain, nationality: 'PT' } as any];
    vvnServiceSpy.createVesselVisitNotification.and.returnValue(of({ code: 'NEW' } as any));

    component.onSaveNewNotification();
    tick();

    expect(vvnServiceSpy.createVesselVisitNotification).toHaveBeenCalled();
    expect(component.statusMessageType).toBe('success');
  }));
});
