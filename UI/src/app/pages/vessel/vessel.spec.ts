import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { Vessel } from './vessel';
import { VesselService } from '../../services/vessel.service';
import { VesselTypeService } from '../../services/vesselType.service';

describe('Vessel', () => {
  let component: Vessel;
  let fixture: ComponentFixture<Vessel>;
  let vesselSpy: jasmine.SpyObj<VesselService>;
  let vtSpy: jasmine.SpyObj<VesselTypeService>;

  beforeEach(async () => {
    vesselSpy = jasmine.createSpyObj('VesselService', ['getAllVesselRecords', 'getVesselRecordByVesselName', 'createVesselRecord', 'updateVesselRecord']);
    vtSpy = jasmine.createSpyObj('VesselTypeService', ['getAllVesselTypes']);

    vesselSpy.getAllVesselRecords.and.returnValue(of([]));
    vesselSpy.getVesselRecordByVesselName.and.returnValue(of(null as any));
    vesselSpy.createVesselRecord.and.returnValue(of({} as any));
    vesselSpy.updateVesselRecord.and.returnValue(of({} as any));
    vtSpy.getAllVesselTypes.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [Vessel, RouterTestingModule, TranslateModule.forRoot(), HttpClientTestingModule],
      providers: [
        { provide: VesselService, useValue: vesselSpy },
        { provide: VesselTypeService, useValue: vtSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Vessel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads vessel records on loadVesselRecords success', () => {
    const mock = [{ id: 1, imoNumber: '1234567', vesselName: 'V1' } as any];
    vesselSpy.getAllVesselRecords.and.returnValue(of(mock));

    component.loadVesselRecords();

    expect(vesselSpy.getAllVesselRecords).toHaveBeenCalled();
    expect(component.vesselRecords.length).toBe(1);
    expect(component.filteredVesselRecords.length).toBe(1);
    expect(component.isLoading).toBeFalse();
  });

  it('handles error when loadVesselRecords fails', () => {
    vesselSpy.getAllVesselRecords.and.returnValue(throwError(() => new Error('load error')));

    component.loadVesselRecords();

    expect(component.isLoading).toBeFalse();
    expect(component.statusMessageType).toBe('error');
  });

  it('loadVesselTypes fills vesselTypes', () => {
    vtSpy.getAllVesselTypes.and.returnValue(of([{ id: 2, name: 'T1' } as any]));

    component.loadVesselTypes();

    expect(vtSpy.getAllVesselTypes).toHaveBeenCalled();
    expect(component.vesselTypes.length).toBe(1);
  });

  it('performSearch matches local and falls back to server', fakeAsync(() => {
    component.vesselRecords = [{ imoNumber: '1234567', vesselName: 'Alpha', vesselTypeName: 'T1', operator: 'Op' } as any];
    component.searchTerm = 'Alpha';
    component.onSearch();
    tick(350);

    expect(component.filteredVesselRecords.length).toBe(1);

    // Now search a name with no local match -> server call
    component.searchTerm = 'NonExist';
    vesselSpy.getVesselRecordByVesselName.and.returnValue(of(null as any));
    component.onSearch();
    tick(350);

    expect(vesselSpy.getVesselRecordByVesselName).toHaveBeenCalledWith('NonExist');
  }));

  it('onSaveNewVesselRecord validates IMO and calls create', () => {
    component.newVesselRecord = { imoNumber: '7654321', vesselName: 'New', vesselTypeName: 'T1', operator: 'Op' } as any;
    vesselSpy.createVesselRecord.and.returnValue(of({ imoNumber: '7654321' } as any));

    component.onSaveNewVesselRecord();

    expect(vesselSpy.createVesselRecord).toHaveBeenCalled();
    expect(component.statusMessageType).toBe('success');
  });
});
