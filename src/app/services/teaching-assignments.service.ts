import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { PreservedArray, TeachingAssignment, TeachingAssignmentPayload } from '../models/teaching-assignment';
import { SchoolClass } from '../models';

export interface AvailableClass {
  id: number;
  name: string;
  gradeId: number;
  gradeName: string;
}

@Injectable({ providedIn: 'root' })
export class TeachingAssignmentsService {
  private baseUrl = `${environment.apiUrl}/TeachingAssignments`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TeachingAssignment[]> {
    return this.http.get<PreservedArray<TeachingAssignment>>(this.baseUrl)
      .pipe(map(res => res.$values));
  }

  getForTeacher(teacherId: number): Observable<TeachingAssignment[]> {
    return this.http.get<PreservedArray<TeachingAssignment>>(`${this.baseUrl}/teacher/${teacherId}`)
      .pipe(map(res => res.$values));
  }

  getForSubject(subjectId: number): Observable<TeachingAssignment[]> {
    return this.http.get<PreservedArray<TeachingAssignment>>(`${this.baseUrl}/subject/${subjectId}`)
      .pipe(map(res => res.$values));
  }

  getAvailableClasses(subjectId: number): Observable<AvailableClass[]> {
    return this.http
      .get<any>(
        `${this.baseUrl}/available-classes/${subjectId}`
      )
      .pipe(
        map(response => {
          const items = Array.isArray(response)
            ? response
            : response?.$values ?? [];

          return items.map((item: any) => ({
            id: item.id,
            name: item.name,
            gradeId: item.gradeId,
            gradeName: item.gradeName,
          }));
        })
      );
  }

  create(payload: TeachingAssignmentPayload): Observable<TeachingAssignment> {
    return this.http.post<TeachingAssignment>(this.baseUrl, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
