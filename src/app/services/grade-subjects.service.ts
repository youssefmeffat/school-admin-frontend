import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GradeSubject {
  id: number;
  gradeId: number;
  subjectId: number;
}

interface PreservedArray<T> {
  $id: string;
  $values: T[];
}

@Injectable({ providedIn: 'root' })
export class GradeSubjectsService {
  private baseUrl = `${environment.apiUrl}/GradeSubjects`;

  constructor(private http: HttpClient) {}

  getForGrade(gradeId: number): Observable<GradeSubject[]> {
    return this.http
      .get<PreservedArray<GradeSubject>>(
        `${this.baseUrl}/grade/${gradeId}`
      )
      .pipe(
        map((res) => res.$values)
      );
  }

  add(gradeId: number, subjectId: number): Observable<GradeSubject> {
    return this.http.post<GradeSubject>(
      this.baseUrl,
      {
        gradeId,
        subjectId,
      }
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${id}`
    );
  }
}