import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { VesselVisitExecutionService } from '../services-oem/vesselVisitExecution.service';
import { VesselStatus } from '../threejs/vessel';

export interface VesselStatusInfo {
  imo: string;
  name: string;
  status: VesselStatus;
  dockAssigned?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VesselStatusService {
  constructor(private vesselVisitExecutionService: VesselVisitExecutionService) {}

  /**
   * Fetch active vessels with their current operational status
   * Returns up to maxVessels active vessels (non-completed)
   */
  getActiveVessels(maxVessels: number = 3): Observable<VesselStatusInfo[]> {
    return this.vesselVisitExecutionService.getAll().pipe(
      map(executions => {
        console.log('🔍 Raw executions from API:', executions);

        // Filter only active vessels (not completed)
        const activeVessels = executions
          .filter(exec => exec.status !== 'Completed')
          .slice(0, maxVessels)
          .map(exec => {
            console.log('📦 Mapping execution:', {
              code: exec.code,
              vesselIMO: exec.vesselIMO,
              name: exec.name,
              status: exec.status,
              DockAssigned: exec.DockAssigned,
              allFields: exec
            });

            return {
              imo: exec.vesselIMO || '',
              name: exec.name || exec.vesselIMO || 'Unknown',
              status: this.mapStatus(exec.status || 'InProgress'),
              dockAssigned: exec.DockAssigned
            };
          });

        console.log('✅ Mapped active vessels:', activeVessels);

        // If no vessels from API, return demo vessels for development
        if (activeVessels.length === 0) {
          console.log('⚠️ No active vessels, using demo data');
          return this.getDemoVessels();
        }

        return activeVessels;
      }),
      catchError(error => {
        console.error('❌ Error fetching vessel status:', error);
        // Return demo vessels as fallback
        return of(this.getDemoVessels());
      })
    );
  }

  /**
   * Map backend status to VesselStatus type
   */
  private mapStatus(status: string): VesselStatus {
    switch (status) {
      case 'Waiting':
        return 'Waiting';
      case 'Loading':
        return 'Loading';
      case 'Unloading':
        return 'Unloading';
      case 'Completed':
        return 'Completed';
      case 'InProgress':
      default:
        return 'InProgress';
    }
  }

  /**
   * Demo vessels for development/fallback
   */
  private getDemoVessels(): VesselStatusInfo[] {
    return [
      {
        imo: '9876543',
        name: 'MV Demo Cargo',
        status: 'Loading',
        dockAssigned: 'Dock A'
      },
      {
        imo: '9876544',
        name: 'MV Test Freighter',
        status: 'Unloading',
        dockAssigned: 'Dock B'
      },
      {
        imo: '9876545',
        name: 'MV Sample Vessel',
        status: 'Waiting'
      }
    ];
  }
}
