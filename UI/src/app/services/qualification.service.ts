import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { QualificationModel } from '../models/qualification.model';

@Injectable({
  providedIn: 'root'
})
export class QualificationService {

  constructor(private apiService: ApiService) {}

  getAllQualifications(): Observable<QualificationModel[]> {
    return this.apiService.get<QualificationModel[]>('/Qualification');
  }

  getQualificationByCode(code: string): Observable<QualificationModel> {
    return this.apiService.get<QualificationModel>(`/Qualification/ByCode/${code}`);
  }

  getQualificationsByName(name: string): Observable<QualificationModel[]> {
    return this.apiService.get<QualificationModel[]>(`/Qualification/ByName/${name}`);
  }

  createQualification(qualification: QualificationModel): Observable<QualificationModel> {
    return this.apiService.post<QualificationModel>('/Qualification', qualification);
  }

  updateQualification(id: number, qualification: QualificationModel): Observable<any> {
    return this.apiService.put<any>(`/Qualification/Update/${id}`, qualification);
  }
}
