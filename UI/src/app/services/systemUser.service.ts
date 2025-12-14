import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class SystemUserService {
	constructor(private api: ApiService) {}

	getAllSystemUsers(): Observable<any[]> {
		return this.api.get<any[]>('/SystemUser');
	}

	getSystemUserByUsername(username: string): Observable<any> {
		return this.api.get<any>(`/SystemUser/ByUsername/${encodeURIComponent(username)}`);
	}

	getSystemUserByEmail(email: string): Observable<any> {
		return this.api.get<any>(`/SystemUser/ByEmail/${encodeURIComponent(email)}`);
	}

	getSystemUserByCode(code: string): Observable<any> {
		return this.api.get<any>(`/SystemUser/ByCode/${encodeURIComponent(code)}`);
	}

	getMyRole(): Observable<{ role: string }> {
		return this.api.get<{ role: string }>('/SystemUser/MyRole');
	}

	addSystemUser(user: any): Observable<any> {
		return this.api.post<any>('/SystemUser', user);
	}

	updateSystemUser(code: string, user: any): Observable<any> {
		return this.api.put<any>(`/SystemUser/Update/${encodeURIComponent(code)}`, user);
	}
}

