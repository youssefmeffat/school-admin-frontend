
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  Grade,
  PagedGradesApiResponse,
  PagedGradesResult,
  mapGrade
} from '../models/grade';

export interface GradePayload {
  name: string;
  number: number;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class GradesService {
  private baseUrl = `${environment.apiUrl}/Grades`;

  constructor(private http: HttpClient) {}

  getAll(
    page = 1,
    pageSize = 20,
    search = ''
  ): Observable<PagedGradesResult> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    const trimmedSearch = search.trim();
    if (trimmedSearch) {
      params = params.set('search', trimmedSearch);
    }

    return this.http
      .get<PagedGradesApiResponse>(this.baseUrl, { params })
      .pipe(
        map(response => ({
          grades: response.items.$values.map(mapGrade),
          page: response.page,
          pageSize: response.pageSize,
          totalCount: response.totalCount,
          totalPages: response.totalPages,
          hasPreviousPage: response.hasPreviousPage,
          hasNextPage: response.hasNextPage,
        }))
      );
  }

  create(payload: GradePayload): Observable<Grade> {
    return this.http.post<Grade>(this.baseUrl, payload);
  }

  update(id: number, payload: GradePayload): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
