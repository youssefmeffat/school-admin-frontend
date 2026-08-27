import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { PageHeaderComponent }
  from '../../shared/page-header/page-header.component';

import { StatCardComponent }
  from '../../shared/stat-card/stat-card.component';

import { HttpClient }
  from '@angular/common/http';

import { environment }
  from '../../../environments/environment';


interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  examsThisWeek: number;
  totalSubjects: number;

  enrollmentByLevel: EnrollmentLevel[];

  studentsPerClass: StudentPerClass[];

  averageScoreBySubject: SubjectAverage[];

  upcomingExams: UpcomingExam[];

  teachers: DashboardTeacher[];

  attendanceHeatmap: AttendanceDay[];
}


interface EnrollmentLevel {
  id: number;
  name: string;
  number: number;
  studentCount: number;
}


interface StudentPerClass {
  id: number;
  name: string;
  gradeId: number;
  gradeName: string;
  studentCount: number;
}


interface SubjectAverage {
  gradeId: number;
  subjectId: number;
  subjectName: string;
  gradeName: string;
  averageScore: number | null;
}


interface UpcomingExam {
  id: number;
  title: string;
  subjectName: string;
  gradeName: string;
  examDate: string | null;
}


interface DashboardTeacher {
  id: number;
  name: string;
  classCount: number;

  classes:
    | TeacherClass[]
    | PreservedArray<TeacherClass>;
}


interface TeacherClass {
  id: number;
  name: string;
  gradeId: number;
  gradeName: string;
  gradeNumber: number;

  subjects:
    | TeacherSubject[]
    | PreservedArray<TeacherSubject>;
}


interface TeacherSubject {
  id: number;
  name: string;
}


interface AttendanceDay {
  date: string;
  day: number;
  isFuture: boolean;

  studentPresent: number;
  studentTotal: number;
  studentPercentage: number;

  teacherPresent: number;
  teacherTotal: number;
  teacherPercentage: number;
}


interface PreservedArray<T> {
  $id?: string;
  $values: T[];
}


interface DashboardApiResponse {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  examsThisWeek: number;
  totalSubjects: number;

  enrollmentByLevel:
    | EnrollmentLevel[]
    | PreservedArray<EnrollmentLevel>;

  studentsPerClass:
    | StudentPerClass[]
    | PreservedArray<StudentPerClass>;

  averageScoreBySubject:
    | SubjectAverage[]
    | PreservedArray<SubjectAverage>;

  upcomingExams:
    | UpcomingExam[]
    | PreservedArray<UpcomingExam>;

  teachers:
    | DashboardTeacher[]
    | PreservedArray<DashboardTeacher>;

  attendanceHeatmap:
    | AttendanceDay[]
    | PreservedArray<AttendanceDay>;
}


@Component({
  selector: 'app-dashboard',

  standalone: true,

  imports: [
    CommonModule,
    PageHeaderComponent,
    StatCardComponent,
    FormsModule
  ],

  templateUrl: './dashboard.component.html',

  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent
  implements OnInit {

  loading = true;

  error = '';

  currentDate = new Date();


  stats: DashboardStats = {

    totalStudents: 0,

    totalTeachers: 0,

    totalClasses: 0,

    examsThisWeek: 0,

    totalSubjects: 0,

    enrollmentByLevel: [],

    studentsPerClass: [],

    averageScoreBySubject: [],

    upcomingExams: [],

    teachers: [],

    attendanceHeatmap: [],
  };


  // =====================================================
  // PANEL SELECTIONS
  // =====================================================

  selectedLevelId = 1;

  attendanceMode:
    'students' | 'teachers' = 'students';


  // =====================================================
  // TEACHER EXPANSION
  // =====================================================

  expandedTeachers =
    new Set<number>();


  constructor(
    private http: HttpClient,

    private cdr: ChangeDetectorRef,
  ) {}


  ngOnInit(): void {

    this.loadDashboard();

  }


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  loadDashboard(): void {

    this.loading = true;

    this.error = '';


    this.http
      .get<DashboardApiResponse>(
        `${environment.apiUrl}/Dashboard/stats`
      )
      .subscribe({

        next: data => {

          this.stats = {

            totalStudents:
              data.totalStudents ?? 0,

            totalTeachers:
              data.totalTeachers ?? 0,

            totalClasses:
              data.totalClasses ?? 0,

            examsThisWeek:
              data.examsThisWeek ?? 0,

            totalSubjects:
              data.totalSubjects ?? 0,


            enrollmentByLevel:
              this.toArray(
                data.enrollmentByLevel
              ),


            studentsPerClass:
              this.toArray(
                data.studentsPerClass
              ),


            averageScoreBySubject:
              this.toArray(
                data.averageScoreBySubject
              ),


            upcomingExams:
              this.toArray(
                data.upcomingExams
              ),


            teachers:
              this.normalizeTeachers(
                data.teachers
              ),


            attendanceHeatmap:
              this.toArray(
                data.attendanceHeatmap
              ),
          };


          // =================================================
          // DEFAULT LEVEL
          // =================================================

          if (
            this.stats.enrollmentByLevel
              .some(g => g.id === 1)
          ) {

            this.selectedLevelId = 1;

          } else if (
            this.stats.enrollmentByLevel.length > 0
          ) {

            this.selectedLevelId =
              this.stats
                .enrollmentByLevel[0]
                .id;
          }


          this.loading = false;


          this.cdr.detectChanges();
        },


        error: err => {

          console.error(
            'Failed to load dashboard:',
            err
          );


          this.error =
            'Could not load dashboard data. Is the API running?';


          this.loading = false;


          this.cdr.detectChanges();
        },
      });
  }


  // =====================================================
  // NORMALIZE ASP.NET $VALUES ARRAYS
  // =====================================================

  private toArray<T>(
    value:
      | T[]
      | PreservedArray<T>
      | null
      | undefined
  ): T[] {

    if (Array.isArray(value)) {

      return value;
    }


    if (
      value &&
      Array.isArray(value.$values)
    ) {

      return value.$values;
    }


    return [];
  }


  // =====================================================
  // NORMALIZE TEACHERS
  //
  // ASP.NET reference-preserving JSON can return:
  //
  // classes: {
  //   "$id": "36",
  //   "$values": [...]
  // }
  //
  // and the same can happen to subjects.
  //
  // We normalize both levels here so the HTML
  // always receives real arrays.
  // =====================================================

  private normalizeTeachers(
    value:
      | DashboardTeacher[]
      | PreservedArray<DashboardTeacher>
      | null
      | undefined
  ): DashboardTeacher[] {

    const teachers =
      this.toArray(value);


    return teachers.map(
      teacher => {

        const classes =
          this.toArray(
            teacher.classes
          );


        return {

          ...teacher,

          classes:
            classes.map(
              teacherClass => {

                return {

                  ...teacherClass,

                  subjects:
                    this.toArray(
                      teacherClass.subjects
                    ),

                };

              }
            ),

        };

      }
    );
  }


  // =====================================================
  // ENROLLMENT
  // =====================================================

  enrollmentWidth(
    count: number
  ): number {

    const max =
      Math.max(
        ...this.stats
          .enrollmentByLevel
          .map(
            x => x.studentCount
          ),
        1
      );


    return (
      count / max
    ) * 100;
  }


  ordinal(
    number: number
  ): string {

    const mod100 =
      number % 100;


    if (
      mod100 >= 11 &&
      mod100 <= 13
    ) {

      return `${number}th`;
    }


    switch (
      number % 10
    ) {

      case 1:
        return `${number}st`;

      case 2:
        return `${number}nd`;

      case 3:
        return `${number}rd`;

      default:
        return `${number}th`;
    }
  }


  // =====================================================
  // STUDENTS PER CLASS
  // =====================================================

  get selectedLevelClasses():
    StudentPerClass[] {

    return this.stats
      .studentsPerClass
      .filter(
        c =>
          c.gradeId ===
          this.selectedLevelId
      );
  }


  studentsPerClassWidth(
    count: number
  ): number {

    const max =
      Math.max(
        ...this.selectedLevelClasses
          .map(
            x => x.studentCount
          ),
        1
      );


    return (
      count / max
    ) * 100;
  }


  onLevelChanged(): void {

    this.cdr.detectChanges();

  }


  // =====================================================
  // SUBJECT AVERAGES
  // =====================================================

  get selectedLevelSubjects():
    SubjectAverage[] {

    return this.stats
      .averageScoreBySubject
      .filter(
        x =>
          x.gradeId ===
          this.selectedLevelId
      );
  }


  subjectAverageWidth(
    average: number | null
  ): number {

    if (
      average === null ||
      average <= 0
    ) {

      return 0;
    }


    return Math.min(
      Math.max(
        average,
        0
      ),
      100
    );
  }


  formatAverage(
    average: number | null
  ): string {

    if (average === null) {

      return '—';
    }


    return `${average.toFixed(1)}%`;
  }


  // =====================================================
  // UPCOMING EXAMS
  // =====================================================

  examDate(
    value: string | null
  ): string {

    if (!value) {

      return 'Unscheduled';
    }


    const date =
      new Date(value);


    return date.toLocaleDateString(
      'en-US',
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }
    );
  }


  // =====================================================
  // TEACHERS
  // =====================================================

  toggleTeacher(
    teacherId: number
  ): void {

    if (
      this.expandedTeachers
        .has(teacherId)
    ) {

      this.expandedTeachers
        .delete(teacherId);

    } else {

      this.expandedTeachers
        .add(teacherId);
    }


    /*
     * Set mutations normally work with Angular's
     * change detection, but explicitly triggering
     * it keeps this reliable with the current
     * component setup.
     */

    this.cdr.detectChanges();
  }


  isTeacherExpanded(
    teacherId: number
  ): boolean {

    return this.expandedTeachers
      .has(teacherId);
  }


  getTeacherClasses(
    teacher: DashboardTeacher
  ): TeacherClass[] {

    return this.toArray(
      teacher.classes
    );
  }


  getTeacherSubjects(
    teacherClass: TeacherClass
  ): TeacherSubject[] {

    return this.toArray(
      teacherClass.subjects
    );
  }


  teacherClassSubjectText(
    teacherClass: TeacherClass
  ): string {

    const subjects =
      this.getTeacherSubjects(
        teacherClass
      );


    if (!subjects.length) {

      return 'No subjects assigned';
    }


    return subjects
      .map(
        subject =>
          subject.name
      )
      .join(', ');
  }


  // =====================================================
  // ATTENDANCE HEATMAP
  // =====================================================

  get attendanceDays():
    AttendanceDay[] {

    return this.stats
      .attendanceHeatmap;
  }


  get attendanceModeLabel():
    string {

    return this.attendanceMode ===
      'students'
        ? 'Students'
        : 'Teachers';
  }


  attendancePercentage(
    day: AttendanceDay
  ): number {

    return this.attendanceMode ===
      'students'
        ? day.studentPercentage
        : day.teacherPercentage;
  }


  attendancePresent(
    day: AttendanceDay
  ): number {

    return this.attendanceMode ===
      'students'
        ? day.studentPresent
        : day.teacherPresent;
  }


  attendanceTotal(
    day: AttendanceDay
  ): number {

    return this.attendanceMode ===
      'students'
        ? day.studentTotal
        : day.teacherTotal;
  }


  attendanceColor(
    day: AttendanceDay
  ): string {

    if (day.isFuture) {

      return '#d6d6d6';
    }


    const percentage =
      this.attendancePercentage(
        day
      );


    /*
     * 0% attendance starts gray.
     * Higher attendance gradually becomes
     * greener.
     */

    const saturation =
      18 +
      percentage * 0.35;


    const lightness =
      88 -
      percentage * 0.38;


    return `hsl(
      135,
      ${saturation}%,
      ${lightness}%
    )`;
  }


  attendanceTooltip(
    day: AttendanceDay
  ): string {

    if (day.isFuture) {

      return `${this.formatHeatmapDate(day.date)} — Future`;
    }


    const percentage =
      this.attendancePercentage(
        day
      );


    const present =
      this.attendancePresent(
        day
      );


    const total =
      this.attendanceTotal(
        day
      );


    return `${this.formatHeatmapDate(day.date)} — ${present}/${total} ${this.attendanceModeLabel.toLowerCase()} present (${percentage.toFixed(1)}%)`;
  }


  private formatHeatmapDate(
    value: string
  ): string {

    const date =
      new Date(
        `${value}T00:00:00`
      );


    return date.toLocaleDateString(
      'en-US',
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }
    );
  }

  formatCurrentDate(): string {

  return this.currentDate.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  }
}