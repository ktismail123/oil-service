import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PrintService {
constructor(private http: HttpClient) {}

  print(data: any) {
    return this.http.post('http://172.20.10.2:3000/api/print', data);
  }
}
