import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { VesselVisitNotificationModel, VisitStatus } from '../models/vesselVisitNotification.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class VesselVisitNotificationService {

  constructor(private apiService: ApiService) {}

  getAllVesselVisitNotifications(): Observable<VesselVisitNotificationModel[]> {
    return this.apiService.get<VesselVisitNotificationModel[]>('/VesselVisitNotification')
      .pipe(
        catchError(this.handleError)
      );
  }

  getVesselVisitNotificationById(id: number): Observable<VesselVisitNotificationModel> {
    return this.apiService.get<VesselVisitNotificationModel>(`/VesselVisitNotification/ById/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getVesselVisitNotificationByCode(code: string): Observable<VesselVisitNotificationModel> {
    return this.apiService.get<VesselVisitNotificationModel>(`/VesselVisitNotification/ByCode/${code}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getVesselVisitNotificationsByOrg(orgCode: string): Observable<VesselVisitNotificationModel[]> {
    return this.apiService.get<VesselVisitNotificationModel[]>(`/VesselVisitNotification/ByOrg/${orgCode}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getVesselVisitNotificationsByVesselIMO_Org(vesselIMO: string, orgCode: string): Observable<VesselVisitNotificationModel[]> {
    return this.apiService.get<VesselVisitNotificationModel[]>(`/VesselVisitNotification/ByVesselIMO_Org/${vesselIMO}/${orgCode}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getVesselVisitNotificationsByDateRange_Org(startDate: string, endDate: string, orgCode: string): Observable<VesselVisitNotificationModel[]> {
    return this.apiService.get<VesselVisitNotificationModel[]>(`/VesselVisitNotification/ByDateRange_Org/${startDate}/${endDate}/${orgCode}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getVesselVisitNotificationsByRepresentative(citizenId: string): Observable<VesselVisitNotificationModel[]> {
    return this.apiService.get<VesselVisitNotificationModel[]>(`/VesselVisitNotification/ByRepresentative/${citizenId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getVesselVisitNotificationsByStatus_Org(status: VisitStatus, orgCode: string): Observable<VesselVisitNotificationModel[]> {
    return this.apiService.get<VesselVisitNotificationModel[]>(`/VesselVisitNotification/ByStatus_Org/${status}/${orgCode}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createVesselVisitNotification(notification: VesselVisitNotificationModel): Observable<VesselVisitNotificationModel> {
    return this.apiService.post<VesselVisitNotificationModel>('/VesselVisitNotification', notification)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateVesselVisitNotification(visitCode: string, notification: VesselVisitNotificationModel): Observable<any> {
    return this.apiService.put(`/VesselVisitNotification/Update/${visitCode}`, notification)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    console.log('Raw HTTP Error Response:', error);
    console.log('Error status:', error.status);
    console.log('Error body:', error.error);
    console.log('Error headers:', error.headers);

    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 400) {
        if (Array.isArray(error.error)) {
          errorMessage = error.error.join('; ');
        } else if (error.error?.errors) {
          // Handle validation errors from ASP.NET Core
          const validationErrors: string[] = [];
          for (const field in error.error.errors) {
            const fieldErrors = error.error.errors[field];
            if (Array.isArray(fieldErrors)) {
              validationErrors.push(`${field}: ${fieldErrors.join(', ')}`);
            }
          }
          errorMessage = validationErrors.length > 0 ? validationErrors.join('; ') : error.error.title || 'Bad request';
        } else {
          errorMessage = error.error?.message || error.error?.title || 'Bad request';
        }
      } else if (error.status === 404) {
        errorMessage = 'Vessel Visit Notification not found';
      } else if (error.status === 409) {
        errorMessage = error.error?.message || 'Conflict occurred';
      } else if (error.status === 500) {
        errorMessage = 'Internal server error occurred';
      } else {
        errorMessage = `Server returned code: ${error.status}, error message is: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
