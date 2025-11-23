import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { StorageArea } from './storageArea';
import { StorageAreaService } from '../../services/storageArea.service';
import { DocksService } from '../../services/docks.service';

describe('StorageArea', () => {
  let component: StorageArea;
  let fixture: ComponentFixture<StorageArea>;
  let storageAreaSpy: jasmine.SpyObj<StorageAreaService>;
  let docksSpy: jasmine.SpyObj<DocksService>;

  beforeEach(async () => {
    storageAreaSpy = jasmine.createSpyObj('StorageAreaService', ['getAllStorageAreas', 'getStorageAreaByLocation', 'createStorageArea', 'updateStorageArea']);
    docksSpy = jasmine.createSpyObj('DocksService', ['getAllDocks']);

    storageAreaSpy.getAllStorageAreas.and.returnValue(of([]));
    storageAreaSpy.getStorageAreaByLocation.and.returnValue(of(null as any));
    storageAreaSpy.createStorageArea.and.returnValue(of({} as any));
    storageAreaSpy.updateStorageArea.and.returnValue(of({} as any));
    docksSpy.getAllDocks.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [StorageArea, RouterTestingModule, TranslateModule.forRoot(), HttpClientTestingModule],
      providers: [
        { provide: StorageAreaService, useValue: storageAreaSpy },
        { provide: DocksService, useValue: docksSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StorageArea);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads storage areas on loadStorageAreas success', () => {
    const mock = [{ id: 1, code: 'SA1', location: 'L1' } as any];
    storageAreaSpy.getAllStorageAreas.and.returnValue(of(mock));

    component.loadStorageAreas();

    expect(storageAreaSpy.getAllStorageAreas).toHaveBeenCalled();
    expect(component.storageAreas.length).toBe(1);
    expect(component.filteredStorageAreas.length).toBe(1);
    expect(component.isLoading).toBeFalse();
  });

  it('handles error when loadStorageAreas fails', () => {
    storageAreaSpy.getAllStorageAreas.and.returnValue(throwError(() => new Error('load error')));

    component.loadStorageAreas();

    expect(component.isLoading).toBeFalse();
    expect(component.statusMessageType).toBe('error');
  });

  it('loadAvailableDocks fills availableDocks', () => {
    const docks = [{ id: 10, name: 'Dock A' } as any];
    docksSpy.getAllDocks.and.returnValue(of(docks));

    component['loadAvailableDocks']();

    expect(docksSpy.getAllDocks).toHaveBeenCalled();
    expect(component.availableDocks.length).toBe(1);
  });

  it('addDockAssociation adds when valid', () => {
    component.availableDocks = [{ id: 1, name: 'D1' } as any];
    component.newDockAssociation = { dockName: 'D1', distance: 5 };
    component.newStorageArea.storageAreaDocks = [];

    component.addDockAssociation();

    expect(component.newStorageArea.storageAreaDocks?.length).toBe(1);
  });

  it('getAvailableDockNames excludes associated docks', () => {
    component.availableDocks = [{ id: 1, name: 'D1' } as any, { id: 2, name: 'D2' } as any];
    component.newStorageArea.storageAreaDocks = [{ dockName: 'D1', distance: 1 } as any];

    const names = component.getAvailableDockNames();
    expect(names).toEqual(['D2']);
  });

  it('searchByLocation returns no results and sets error message', fakeAsync(() => {
    storageAreaSpy.getStorageAreaByLocation.and.returnValue(of(null as any));

    component.searchByLocation('nowhere');
    tick();

    expect(component.filteredStorageAreas.length).toBe(0);
    expect(component.statusMessageType).toBe('error');
  }));
});
