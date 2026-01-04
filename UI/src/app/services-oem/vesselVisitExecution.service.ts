import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { VesselVisitExecutionModel } from '../models/vesselVisitExecution.model';
import { OemService } from './oem.service';

@Injectable({ providedIn: 'root' })
export class VesselVisitExecutionService {
  constructor(private oemService: OemService) {}

  // OEM endpoints under /vessel-visit-executions
  getAll(): Observable<VesselVisitExecutionModel[]> {
    return this.oemService.get<any[]>('/vessel-visit-executions').pipe(
      map((dtos) => (dtos || []).map(this.mapDtoToVVE)),
      catchError((err) => this.handleError('getAll', err))
    );
  }

  search(filters: { from?: string; to?: string; vesselIMO?: string; status?: string }): Observable<VesselVisitExecutionModel[]> {
    const params: string[] = [];
    if (filters.from) params.push(`from=${encodeURIComponent(filters.from)}`);
    if (filters.to) params.push(`to=${encodeURIComponent(filters.to)}`);
    if (filters.vesselIMO) params.push(`vesselIMO=${encodeURIComponent(filters.vesselIMO)}`);
    if (filters.status) params.push(`status=${encodeURIComponent(filters.status)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.oemService.get<any[]>(`/vessel-visit-executions${query}`).pipe(
      map((dtos) => (dtos || []).map(this.mapDtoToVVE)),
      catchError((err) => this.handleError('search', err))
    );
  }

  // No dedicated name endpoint; perform client-side filtering
  getByName(name: string): Observable<VesselVisitExecutionModel[]> {
    const term = (name || '').toLowerCase();
    return this.getAll().pipe(
      map(items => items.filter(i =>
        (i.name || '').toLowerCase().includes(term) ||
        (i.code || '').toLowerCase().includes(term) ||
        (i.description || '').toLowerCase().includes(term)
      )),
      catchError((err) => this.handleError('getByName', err))
    );
  }

  create(model: VesselVisitExecutionModel): Observable<any> {
    // Align payload with OEM route expectations and forward extra fields (e.g., incidentIDs)
    const payload: any = {
      vesselVisitNotificationCode: (model as any).vesselVisitNotificationCode ?? model.code,
      arrivalDate: (model as any).arrivalDate,
      incidentIDs: (model as any).incidentIDs ?? null
    };
    return this.oemService.post<any>('/vessel-visit-executions', payload).pipe(
      catchError((err) => this.handleError('create', err))
    );
  }

  update(code: string, payload: any): Observable<any> {
    return this.oemService.put<any>(`/vessel-visit-executions/${code}`, payload).pipe(
      catchError((err) => this.handleError('update', err))
    );
  }

  private mapDtoToVVE = (dto: any): VesselVisitExecutionModel => {
    console.log('🔧 Mapping DTO to VVE:', dto);

    // Try multiple field name variations for dock assignment
    const dockAssigned = dto?.DockAssigned
      || dto?.dockAssigned
      || dto?.dock
      || dto?.assignedDock
      || dto?.plannedDock
      || dto?.dockName
      || dto?.Dock
      || '';

    console.log('🏗️ Dock assignment found:', dockAssigned, 'from:', {
      DockAssigned: dto?.DockAssigned,
      dockAssigned: dto?.dockAssigned,
      dock: dto?.dock,
      assignedDock: dto?.assignedDock,
      plannedDock: dto?.plannedDock,
      dockName: dto?.dockName,
      Dock: dto?.Dock
    });

    return {
      id: dto?.id ?? dto?._id ?? undefined,
      code: dto?.code ?? '',
      name: dto?.vesselIMO ?? dto?.vessel?.imo ?? '',
      vesselIMO: dto?.vesselIMO ?? dto?.vessel?.imo ?? '',
      description: dto?.status ?? dto?.visitStatus ?? '',
      status: dto?.status ?? dto?.visitStatus,
      departureDate: dto?.departureDate,
      arrivalDate: dto?.arrivalDate,
      lastUpdated: dto?.lastUpdated,
      systemUserID: dto?.systemUserID,
      vesselVisitNotificationCode: dto?.vesselVisitNotificationCode ?? '',
      DockAssigned: dockAssigned,
      operations: dto?.operations ?? []
    };
  };

  private handleError(context: string, error: any) {
    const errorMessage = error?.error?.message || error?.message || `VVE service error in ${context}`;
    console.error('VesselVisitExecutionService error:', errorMessage);
    return throwError(() => ({ message: errorMessage, originalError: error }));
  }
}
