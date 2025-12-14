import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DataRequestModel } from '../models/dataRequest.model';

@Injectable({
  providedIn: 'root'
})
export class DataRequestService {
  private readonly endpoint = '/DataRequest';

  constructor(private apiService: ApiService) {}

 
  getAllDataRequests(): Observable<DataRequestModel[]> {
    return this.apiService.get<DataRequestModel[]>(this.endpoint);
  }


  getDataRequestById(id: number): Observable<DataRequestModel> {
    return this.apiService.get<DataRequestModel>(`${this.endpoint}/ByID/${id}`);
  }


  getDataRequestsByEmail(email: string): Observable<DataRequestModel[]> {
    return this.apiService.get<DataRequestModel[]>(`${this.endpoint}/ByEmail/${email}`);
  }


  getDataRequestsByType(requestType: string): Observable<DataRequestModel[]> {
    return this.apiService.get<DataRequestModel[]>(`${this.endpoint}/ByType/${requestType}`);
  }


  getDataRequestsByStatus(status: string): Observable<DataRequestModel[]> {
    return this.apiService.get<DataRequestModel[]>(`${this.endpoint}/ByStatus/${status}`);
  }


  createDataRequest(dataRequest: DataRequestModel): Observable<DataRequestModel> {
    return this.apiService.post<DataRequestModel>(this.endpoint, dataRequest);
  }
}
