
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  Teacher,
  TeacherApi,
  TeacherPayload,
  PagedTeachersApiResponse,
  PagedTeachersResult,
  mapTeacher,
} from '../models/teacher';

@Injectable({ providedIn: 'root' })
export class TeachersService {
  private baseUrl = `${environment.apiUrl}/Teachers`;

  constructor(private http: HttpClient) {}

  getAll(
    page = 1,
    pageSize = 20,
    search = ''
  ): Observable<PagedTeachersResult> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    const trimmedSearch = search.trim();

    if (trimmedSearch) {
      params = params.set('search', trimmedSearch);
    }

    return this.http
      .get<PagedTeachersApiResponse>(this.baseUrl, { params })
      .pipe(
        map((response) => ({
          teachers: response.items.$values.map(mapTeacher),
          page: response.page,
          pageSize: response.pageSize,
          totalCount: response.totalCount,
          totalPages: response.totalPages,
          hasPreviousPage: response.hasPreviousPage,
          hasNextPage: response.hasNextPage,
        }))
      );
  }

  getById(id: number): Observable<Teacher> {
    return this.http
      .get<TeacherApi>(`${this.baseUrl}/${id}`)
      .pipe(map(mapTeacher));
  }

  create(payload: TeacherPayload): Observable<TeacherApi> {
    return this.http.post<TeacherApi>(this.baseUrl, payload);
  }

  update(id: number, payload: TeacherPayload): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
