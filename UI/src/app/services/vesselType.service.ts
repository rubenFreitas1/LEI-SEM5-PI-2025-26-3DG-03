import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { VesselTypeModel } from '../models/vesselType.model';

@Injectable({
  providedIn: 'root'
})
export class VesselTypeService {

  constructor(private apiService: ApiService) {}

  getAllVesselTypes(): Observable<VesselTypeModel[]> {
    return this.apiService.get<VesselTypeModel[]>('/VesselType');
  }

  getVesselTypeByName(name: string): Observable<VesselTypeModel[]> {
    return this.apiService.get<VesselTypeModel[]>(`/VesselType/ByName/${name}`);
  }

  getVesselTypeById(id: number): Observable<VesselTypeModel> {
    return this.apiService.get<VesselTypeModel>(`/VesselType/ByID/${id}`);
  }

  getVesselTypeByDescription(description: string): Observable<VesselTypeModel[]> {
    return this.apiService.get<VesselTypeModel[]>(`/VesselType/ByDescription/${description}`);
  }

  createVesselType(vesselType: VesselTypeModel): Observable<VesselTypeModel> {
    return this.apiService.post<VesselTypeModel>('/VesselType', vesselType);
  }

  updateVesselType(id: number, vesselType: VesselTypeModel): Observable<any> {
    return this.apiService.put<any>(`/VesselType/Update/${id}`, vesselType);
  }
}
