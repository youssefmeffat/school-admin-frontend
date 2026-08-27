import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  SchoolClass,
  ClassApi,
  ClassPayload,
  PagedClassesApiResponse,
  PagedClassesResult,
  UpdateClassStudentsPayload,
  mapSchoolClass
} from '../models/school-class';

@Injectable({ providedIn: 'root' })
export class ClassesService {
  private baseUrl = `${environment.apiUrl}/SchoolClasses`;

  constructor(private http: HttpClient) {}

  getAll(
    page = 1,
    pageSize = 20,
    search = ''
  ): Observable<PagedClassesResult> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    const trimmedSearch = search.trim();
    if (trimmedSearch) {
      params = params.set('search', trimmedSearch);
    }

    return this.http
      .get<PagedClassesApiResponse>(this.baseUrl, { params })
      .pipe(
        map(response => ({
          classes: response.items.$values.map(mapSchoolClass),
          page: response.page,
          pageSize: response.pageSize,
          totalCount: response.totalCount,
          totalPages: response.totalPages,
          hasPreviousPage: response.hasPreviousPage,
          hasNextPage: response.hasNextPage,
        }))
      );
  }

  getById(id: number): Observable<SchoolClass> {
    return this.http.get<ClassApi>(`${this.baseUrl}/${id}`)
      .pipe(map(mapSchoolClass));
  }

  create(payload: ClassPayload): Observable<ClassApi> {
    return this.http.post<ClassApi>(this.baseUrl, payload);
  }

  update(id: number, payload: ClassPayload): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  updateStudents(id: number, payload: UpdateClassStudentsPayload): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/students`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
