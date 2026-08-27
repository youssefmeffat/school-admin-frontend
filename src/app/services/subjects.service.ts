import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PagedSubjectsApiResponse,
  Subject,
  SubjectApi,
  mapSubject
} from '../models/subject';

export interface SubjectPayload {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class SubjectsService {
  private baseUrl = `${environment.apiUrl}/Subjects`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Subject[]> {
    const params = new HttpParams()
      .set('page', 1)
      .set('pageSize', 100);

    return this.http
      .get<PagedSubjectsApiResponse>(this.baseUrl, { params })
      .pipe(
        map(response =>
          response.items.$values.map(mapSubject)
        )
      );
  }

  create(payload: SubjectPayload): Observable<SubjectApi> {
    return this.http.post<SubjectApi>(this.baseUrl, payload);
  }

  update(id: number, payload: SubjectPayload): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
