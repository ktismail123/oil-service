import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboardData(filters: any): Observable<any> {
    const params = this.buildHttpParams(filters);
    return this.http.get(`${this.apiUrl}`, { params });
  }

  exportDashboardData(filters: any): Observable<any> {
    const exportFilters = {
      ...filters,
      format: filters.format || 'general_report'
    };

    const params = this.buildHttpParams(exportFilters);
    
    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'json'
    });
  }

  exportVATReport(year: string, month: string): Observable<Blob> {
    const params = new HttpParams()
      .set('year', year)
      .set('month', month)
      .set('status', 'completed')
      .set('format', 'vat_report');

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  // Helper method to build HttpParams properly
  private buildHttpParams(filters: any): HttpParams {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        // Convert all values to string as HttpParams expects string values
        params = params.set(key, value.toString());
      }
    });
    
    return params;
  }
}