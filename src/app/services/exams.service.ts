import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  Exam,
  ExamApi,
  ExamPayload,
  PagedExamsApiResponse,
  PagedExamsResult,
  mapExam,
} from '../models/exam';

export interface ExamParticipant {
  studentId: number;
  studentName: string;
  score: number | null;
  notes: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  private readonly baseUrl =
    `${environment.apiUrl}/Exams`;

  private readonly studentExamsUrl =
    `${environment.apiUrl}/StudentExams`;

  constructor(
    private http: HttpClient,
  ) {}

  getAll(
    page = 1,
    pageSize = 20,
    search = '',
    status = 'All',
  ): Observable<PagedExamsResult> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    const trimmedSearch = search.trim();

    if (trimmedSearch) {
      params = params.set('search', trimmedSearch);
    }

    if (status && status !== 'All') {
      params = params.set('status', status);
    }

    return this.http
      .get<PagedExamsApiResponse>(
        this.baseUrl,
        { params }
      )
      .pipe(
        map(response => ({
          exams: response.items.$values.map(mapExam),
          page: response.page,
          pageSize: response.pageSize,
          totalCount: response.totalCount,
          totalPages: response.totalPages,
          hasPreviousPage: response.hasPreviousPage,
          hasNextPage: response.hasNextPage,
        }))
      );
  }

  create(payload: ExamPayload): Observable<ExamApi> {
    return this.http.post<ExamApi>(
      this.baseUrl,
      payload
    );
  }

  update(
    id: number,
    payload: ExamPayload,
  ): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/${id}`,
      payload
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${id}`
    );
  }

  getParticipants(
    examId: number,
  ): Observable<ExamParticipant[]> {
    return this.http
      .get<any>(
        `${this.studentExamsUrl}/exam/${examId}/participants`
      )
      .pipe(
        map(response => {
          const values = Array.isArray(response)
            ? response
            : response?.$values ?? [];

          return values.map((item: any) => ({
            studentId: item.studentId,
            studentName: item.studentName,
            score: item.score ?? null,
            notes: item.notes ?? null,
          }));
        }),
      );
  }

  saveScore(
    studentId: number,
    examId: number,
    score: number,
  ): Observable<void> {
    return this.http.put<void>(
      `${this.studentExamsUrl}/score`,
      null,
      {
        params: {
          studentId,
          examId,
          score,
        },
      }
    );
  }
}
