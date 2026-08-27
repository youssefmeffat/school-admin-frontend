import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';


export interface EnrollmentLevel {
  id: number;
  name: string;
  number: number;
  studentCount: number;
}


export interface StudentsPerClass {
  id: number;
  name: string;
  gradeId: number;
  gradeName: string;
  studentCount: number;
}


export interface AverageScoreBySubject {
  gradeId: number;
  subjectId: number;
  subjectName: string;
  gradeName: string;

  // null means the subject has no recorded results yet.
  averageScore: number | null;
}


export interface UpcomingExam {
  id: number;
  title: string;
  subjectName: string;
  gradeName: string;
  examDate: string | null;
}


interface DashboardStatsResponse {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  examsThisWeek: number;
  totalSubjects: number;

  enrollmentByLevel:
    | EnrollmentLevel[]
    | {
        $id?: string;
        $values: EnrollmentLevel[];
      };

  studentsPerClass:
    | StudentsPerClass[]
    | {
        $id?: string;
        $values: StudentsPerClass[];
      };

  averageScoreBySubject:
    | AverageScoreBySubject[]
    | {
        $id?: string;
        $values: AverageScoreBySubject[];
      };

  upcomingExams:
    | UpcomingExam[]
    | {
        $id?: string;
        $values: UpcomingExam[];
      };
}


export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  examsThisWeek: number;
  totalSubjects: number;

  enrollmentByLevel: EnrollmentLevel[];

  studentsPerClass: StudentsPerClass[];

  averageScoreBySubject: AverageScoreBySubject[];

  upcomingExams: UpcomingExam[];
}


@Injectable({
  providedIn: 'root',
})
export class DashboardService {

  private readonly baseUrl =
    `${environment.apiUrl}/Dashboard`;


  constructor(
    private http: HttpClient,
  ) {}


  getStats(): Observable<DashboardStats> {

    return this.http
      .get<DashboardStatsResponse>(
        `${this.baseUrl}/stats`,
      )
      .pipe(

        map(response => {

          const enrollment =
            Array.isArray(
              response.enrollmentByLevel,
            )
              ? response.enrollmentByLevel
              : response.enrollmentByLevel?.$values ?? [];


          const studentsPerClass =
            Array.isArray(
              response.studentsPerClass,
            )
              ? response.studentsPerClass
              : response.studentsPerClass?.$values ?? [];


          const averageScoreBySubject =
            Array.isArray(
              response.averageScoreBySubject,
            )
              ? response.averageScoreBySubject
              : response.averageScoreBySubject?.$values ?? [];


          const upcomingExams =
            Array.isArray(
              response.upcomingExams,
            )
              ? response.upcomingExams
              : response.upcomingExams?.$values ?? [];


          return {

            totalStudents:
              response.totalStudents,

            totalTeachers:
              response.totalTeachers,

            totalClasses:
              response.totalClasses,

            examsThisWeek:
              response.examsThisWeek,

            totalSubjects:
              response.totalSubjects,

            enrollmentByLevel:
              enrollment,

            studentsPerClass:
              studentsPerClass,

            averageScoreBySubject:
              averageScoreBySubject,

            upcomingExams:
              upcomingExams,

          };

        }),

      );
  }
}