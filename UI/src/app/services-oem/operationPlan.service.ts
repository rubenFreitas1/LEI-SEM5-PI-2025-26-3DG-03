import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { OemService } from './oem.service';

@Injectable({ providedIn: 'root' })
export class OperationPlanService {
  constructor(private oemService: OemService) {}

  createBatch(payload: {
    vvns: string[];
    assignedCranes: string[][];
    staffs: string[][];
    operationTypes: string[][];
    containers: string[][];
    arrivalTimes: string[];
    departureTimes: string[];
    targetDays: string[];
    author: string;
    algorithm: string;
  }): Observable<any> {
    return this.oemService.post<any>('/operation-plans', payload).pipe(
      catchError((err) => {
        console.error('Error creating operation plans:', err);
        return throwError(() => ({
          message: err?.error?.error || err?.message || 'Error creating operation plans',
          originalError: err
        }));
      })
    );
  }

  getAll(): Observable<any[]> {
    return this.oemService.get<any[]>('/operation-plans').pipe(
      catchError((err) => {
        console.error('Error fetching operation plans:', err);
        return throwError(() => ({
          message: err?.error?.error || err?.message || 'Error fetching operation plans',
          originalError: err
        }));
      })
    );
  }

  update(vvn: string, payload: any): Observable<any> {
    return this.oemService.put<any>(`/operation-plans/update/${vvn}`, payload).pipe(
      catchError((err) => {
        console.error('Error updating operation plan:', err);
        return throwError(() => ({
          message: err?.error?.error || err?.message || 'Error updating operation plan',
          originalError: err
        }));
      })
    );
  }

  getVvnsWithoutOperationPlan(): Observable<any[]> {
    return this.oemService.get<any[]>('/operation-plans/missing').pipe(
      catchError((err) => {
        console.error('Error fetching VVNs without operation plans:', err);
        return throwError(() => ({
          message: err?.error?.error || err?.message || 'Error fetching VVNs without operation plans',
          originalError: err
        }));
      })
    );
  }

  regenerateOperationPlansForDay(targetDay: Date, author: string, algorithm: string): Observable<any> {
    return this.oemService.post<any>('/operation-plans/regenerate', {
      targetDay: targetDay.toISOString().split('T')[0],
      author,
      algorithm
    }).pipe(
      catchError((err) => {
        console.error('Error regenerating operation plans:', err);
        return throwError(() => ({
          message: err?.error?.error || err?.message || 'Error regenerating operation plans',
          originalError: err
        }));
      })
    );
  }
}
