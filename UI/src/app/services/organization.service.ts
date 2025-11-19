import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ShippingAgentOrganizationModel, ShippingAgentOrganizationWithRepresentativeModel, RepresentativeModel } from '../models/organization.model';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private resource = '/ShippingAgentOrganization';

  constructor(private apiService: ApiService) { }

  getAllOrganizations(): Observable<ShippingAgentOrganizationWithRepresentativeModel[]> {
    return this.apiService.get<ShippingAgentOrganizationWithRepresentativeModel[]>(this.resource);
  }

  getOrganizationById(id: number): Observable<ShippingAgentOrganizationWithRepresentativeModel> {
    return this.apiService.get<ShippingAgentOrganizationWithRepresentativeModel>(`${this.resource}/${id}`);
  }

  createOrganization(organization: ShippingAgentOrganizationWithRepresentativeModel): Observable<ShippingAgentOrganizationWithRepresentativeModel> {
    return this.apiService.post<ShippingAgentOrganizationWithRepresentativeModel>(this.resource, organization);
  }

  updateOrganization(id: number, organization: ShippingAgentOrganizationModel): Observable<any> {
    return this.apiService.put<any>(`${this.resource}/Update/${id}`, organization);
  }

  deleteOrganization(id: number): Observable<any> {
    return this.apiService.delete<any>(`${this.resource}/${id}`);
  }

  // Representative management
  addRepresentativeToOrganization(organizationId: number, representative: RepresentativeModel): Observable<any> {
    return this.apiService.post<any>(`${this.resource}/${organizationId}/representatives`, representative);
  }

  updateRepresentative(organizationId: number, representative: RepresentativeModel): Observable<any> {
    return this.apiService.put<any>(`${this.resource}/${organizationId}/representatives`, representative);
  }

  removeRepresentativeFromOrganization(organizationId: number): Observable<any> {
    return this.apiService.delete<any>(`${this.resource}/${organizationId}/representatives`);
  }
}
