import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RepresentativeModel } from '../models/representative.model';

@Injectable({
  providedIn: 'root'
})
export class RepresentativeService {
  private resource = '/Representative';

  constructor(private apiService: ApiService) { }

  getAllRepresentatives(): Observable<RepresentativeModel[]> {
    return this.apiService.get<RepresentativeModel[]>(this.resource);
  }

  getRepresentativeById(id: number): Observable<RepresentativeModel> {
    return this.apiService.get<RepresentativeModel>(`${this.resource}/ByID/${id}`);
  }

  getRepresentativeByEmail(email: string): Observable<RepresentativeModel> {
    return this.apiService.get<RepresentativeModel>(`${this.resource}/ByEmail/${email}`);
  }

  getRepresentativeByPhoneNumber(phoneNumber: string): Observable<RepresentativeModel> {
    return this.apiService.get<RepresentativeModel>(`${this.resource}/ByPhoneNumber/${phoneNumber}`);
  }

  getRepresentativeByCitizenId(citizenId: string): Observable<RepresentativeModel> {
    return this.apiService.get<RepresentativeModel>(`${this.resource}/ByCitizenId/${citizenId}`);
  }

  getRepresentativeByName(name: string): Observable<RepresentativeModel> {
    return this.apiService.get<RepresentativeModel>(`${this.resource}/ByName/${name}`);
  }

  getRepresentativesByOrganization(organizationName: string): Observable<RepresentativeModel[]> {
    return this.apiService.get<RepresentativeModel[]>(`${this.resource}/ByOrganization/${organizationName}`);
  }

  createRepresentative(representative: RepresentativeModel): Observable<RepresentativeModel> {
    return this.apiService.post<RepresentativeModel>(this.resource, representative);
  }

  updateRepresentative(id: number, representative: RepresentativeModel): Observable<any> {
    return this.apiService.put<any>(`${this.resource}/Update/${id}`, representative);
  }
}
