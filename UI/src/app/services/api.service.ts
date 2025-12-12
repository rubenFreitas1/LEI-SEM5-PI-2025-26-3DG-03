import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://lapr5-frontend.duckdns.org/api';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, this.httpOptions).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Something went wrong.';
    let errorDetails = '';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      console.error('Full error object:', error);
      console.error('Error response body:', error.error);

      // Try to extract meaningful error message from different possible formats
      if (error.error) {
        // Check if error.error is a string (plain text response)
        if (typeof error.error === 'string') {
          errorDetails = error.error;
        }
        // Check if error.error is an array (list of error messages from backend)
        else if (Array.isArray(error.error)) {
          errorDetails = error.error.join('; ');
        }
        // Check if error.error is an object
        else if (typeof error.error === 'object') {
          // Check for common error message formats
          if (error.error.message) {
            errorDetails = error.error.message;
          } else if (error.error.title) {
            errorDetails = error.error.title;
          } else if (error.error.detail) {
            errorDetails = error.error.detail;
          } else if (error.error.errors) {
            // Handle validation errors (like from ASP.NET Core model validation)
            if (typeof error.error.errors === 'object') {
              const validationErrors = Object.values(error.error.errors).flat();
              errorDetails = validationErrors.join('; ');
            } else if (typeof error.error.errors === 'string') {
              errorDetails = error.error.errors;
            }
          } else if (error.error.error) {
            // Sometimes the error is nested in another error property
            errorDetails = error.error.error;
          } else {
            // If it's an object but no specific message field, stringify it
            try {
              errorDetails = JSON.stringify(error.error);
            } catch {
              errorDetails = 'Error parsing server response';
            }
          }
        }
      }

      // If we still don't have error details, try the error message
      if (!errorDetails && error.message) {
        errorDetails = error.message;
      }

      switch (error.status) {
        case 400:
          errorMessage = errorDetails || 'Bad Request - Invalid data provided';
          break;
        case 401:
          errorMessage = errorDetails || 'Unauthorized - Please login again';
          break;
        case 403:
          errorMessage = errorDetails || 'Access denied - You don\'t have permission';
          break;
        case 404:
          errorMessage = errorDetails || 'Resource not found';
          break;
        case 409:
          errorMessage = errorDetails || 'Conflict - Resource already exists';
          break;
        case 422:
          errorMessage = errorDetails || 'Unprocessable Entity - Validation failed';
          break;
        case 500:
          errorMessage = errorDetails || 'Internal Server Error';
          break;
        default:
          errorMessage = errorDetails || `Server Error: ${error.status}`;
      }
    }

    console.error('Final error message:', errorMessage);

    // Return an error object with both message and original error for debugging
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      originalError: error
    }));
  }
}
