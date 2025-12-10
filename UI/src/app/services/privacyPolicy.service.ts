import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PrivacyPolicyDTO {
  id: number;
  content: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PrivacyPolicyService {

  constructor(private apiService: ApiService) {}

  getCurrentPolicy(): Observable<PrivacyPolicyDTO> {
    return this.apiService.get<PrivacyPolicyDTO>('/PrivacyPolicy/current');
  }

  getPolicyHistory(): Observable<PrivacyPolicyDTO[]> {
    return this.apiService.get<PrivacyPolicyDTO[]>('/PrivacyPolicy/history');
  }

  createPolicy(content: string): Observable<PrivacyPolicyDTO> {
    return this.apiService.post<PrivacyPolicyDTO>('/PrivacyPolicy', { content });
  }

  checkPrivacyPolicyUpdate(): Observable<PrivacyPolicyCheckResponse> {
    return this.apiService.get<PrivacyPolicyCheckResponse>('/PrivacyPolicy/check-update');
  }

  acceptPrivacyPolicy(): Observable<any> {
    return this.apiService.post('/PrivacyPolicy/accept', null);
  }
}

export interface PrivacyPolicyCheckResponse {
  hasNewPolicy: boolean;
  currentPolicy: PrivacyPolicyDTO | null;
}
