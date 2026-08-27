import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Student,
  StudentApi,
  StudentPayload,
  mapStudent,
} from '../models/student';

// ReferenceHandler.Preserve is on globally in Program.cs, so EVERY list
// response — not just GetAll's Items — comes back wrapped like this
// instead of being a bare array.
export interface PreservedArray<T> {
  $id: string;
  $values: T[];
}

export interface StudentExamResult {
  id: number;
  studentId: number;
  examId: number;
  score: number | null;
  notes: string | null;

  exam?: {
    id: number;
    name: string | null;
    subjectId: number;
    subjectName: string | null;
    gradeId: number;
    gradeName: string | null;
    examDate: string | null;
    maxScore: number | null;
  };

  examName?: string | null;
  subjectName?: string | null;
  gradeName?: string | null;
  examDate?: string | null;
  maxScore?: number | null;
}

export interface StudentAttendanceRecord {
  id: number;
  studentId: number;
  date: string;
  status: number | string;
  checkInTime: string | null;
  checkOutTime: string | null;
  notes: string | null;
  recordedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PagedStudentsApiResponse {
  items: PreservedArray<StudentApi>;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}


export interface PagedStudentsResult {
  students: Student[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


@Injectable({ providedIn: 'root' })
export class StudentsService {
  private baseUrl = `${environment.apiUrl}/Students`;

  private studentExamsUrl =
    `${environment.apiUrl}/StudentExams`;

  private attendanceUrl =
    `${environment.apiUrl}/Attendance`;

  constructor(private http: HttpClient) {}

  // =====================================================
  // STUDENTS
  // =====================================================

  getAll(
    page = 1,
    pageSize = 25,
    search = ''
  ): Observable<PagedStudentsResult> {

    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (search.trim()) {
      params = params.set(
        'search',
        search.trim()
      );
    }

    return this.http
      .get<PagedStudentsApiResponse>(
        this.baseUrl,
        { params }
      )
      .pipe(
        map((response) => ({
          students: response.items.$values.map(mapStudent),
          totalCount: response.totalCount,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
        }))
      );
  }

  getById(id: number): Observable<Student> {
    return this.http
      .get<StudentApi>(`${this.baseUrl}/${id}`)
      .pipe(
        map(mapStudent)
      );
  }

  create(
    payload: StudentPayload
  ): Observable<StudentApi> {
    return this.http.post<StudentApi>(
      this.baseUrl,
      payload
    );
  }

  update(
    id: number,
    payload: StudentPayload
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

  // =====================================================
  // EXAM RESULTS
  // =====================================================

  getExamResults(
    studentId: number
  ): Observable<StudentExamResult[]> {
    return this.http
      .get<PreservedArray<StudentExamResult>>(
        `${this.studentExamsUrl}/student/${studentId}`
      )
      .pipe(
        map((res) => res.$values)
      );
  }

  // =====================================================
  // ATTENDANCE HISTORY
  // =====================================================

  getAttendance(
    studentId: number,
    from: Date,
    to: Date
  ): Observable<StudentAttendanceRecord[]> {
    const params = new HttpParams()
      .set(
        'from',
        this.formatDate(from)
      )
      .set(
        'to',
        this.formatDate(to)
      );

    return this.http
      .get<PreservedArray<StudentAttendanceRecord>>(
        `${this.attendanceUrl}/students/${studentId}`,
        { params }
      )
      .pipe(
        map((res) => res.$values)
      );
  }

  private formatDate(
    date: Date
  ): string {
    const year = date.getFullYear();
    const month =
      String(date.getMonth() + 1)
        .padStart(2, '0');
    const day =
      String(date.getDate())
        .padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}