import {
  Component,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent }
  from '../../shared/page-header/page-header.component';

import { StudentFormModalComponent }
  from './student-form-modal.component';

import { Student }
  from '../../models/student';

import {
  StudentsService,
  StudentExamResult,
  StudentAttendanceRecord,
  PagedStudentsResult,
} from '../../services/students.service';


interface StudentDetails {
  loading: boolean;
  error: string;

  exams: StudentExamResult[];
  attendance: StudentAttendanceRecord[];
}


interface AttendanceDay {
  date: Date;
  record: StudentAttendanceRecord | null;
  isWeekend: boolean;
}


@Component({
  selector: 'app-students',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    StudentFormModalComponent,
  ],

  templateUrl: './students.component.html',

  styleUrl: './students.component.scss',
})
export class StudentsComponent
  implements OnInit {

  students: Student[] = [];

  loading = true;

  error = '';

  searchTerm = '';

  // =====================================================
  // PAGINATION
  // =====================================================

  pageSize = 25;

  currentPage = 1;

  totalCount = 0;

  totalPages = 0;


  // =====================================================
  // MODAL
  // =====================================================

  showModal = false;

  modalMode:
    'create' | 'edit' = 'create';

  selectedStudent:
    Student | null = null;


  pendingDeleteId:
    number | null = null;


  // =====================================================
  // EXPANDED STUDENT
  // =====================================================

  expandedStudentId:
    number | null = null;


  studentDetails:
    Record<number, StudentDetails> = {};


  constructor(
    private studentsService:
      StudentsService,

    private cdr:
      ChangeDetectorRef
  ) {}


  ngOnInit(): void {
    this.fetch();
  }


  // =====================================================
  // LOAD STUDENTS
  // =====================================================

  fetch(page: number = this.currentPage): void {

    this.loading = true;

    this.error = '';

    this.expandedStudentId = null;

    this.studentDetails = {};

    this.currentPage = page;


    this.studentsService
      .getAll(
        this.currentPage,
        this.pageSize,
        this.searchTerm
      )
      .subscribe({

        next: (data: PagedStudentsResult) => {

          this.students = data.students;

          this.currentPage = data.page;

          this.pageSize = data.pageSize;

          this.totalCount = data.totalCount;

          this.totalPages = data.totalPages;

          this.loading = false;

          this.cdr.detectChanges();
        },

        error: (err) => {

          console.error(
            'Failed to load students:',
            err
          );

          this.error =
            'Could not load students. Is the API running on localhost:5216?';

          this.loading = false;

          this.cdr.detectChanges();
        },
      });
  }


  // =====================================================
  // SERVER-SIDE SEARCH + PAGINATION
  // =====================================================

  get filtered(): Student[] {
    return this.students;
  }


  get paginatedStudents(): Student[] {
    return this.students;
  }


  get pageNumbers(): number[] {

    if (this.totalPages <= 0) {
      return [];
    }

    const maxVisible = 5;

    let start = Math.max(
      1,
      this.currentPage -
        Math.floor(maxVisible / 2)
    );

    let end = Math.min(
      this.totalPages,
      start + maxVisible - 1
    );

    if (end - start + 1 < maxVisible) {
      start = Math.max(
        1,
        end - maxVisible + 1
      );
    }

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index
    );
  }


  get pageStart(): number {

    if (this.totalCount === 0) {
      return 0;
    }

    return (
      (this.currentPage - 1) *
      this.pageSize
    ) + 1;
  }


  get pageEnd(): number {

    return Math.min(
      this.currentPage * this.pageSize,
      this.totalCount
    );
  }


  onSearchChange(): void {

    this.currentPage = 1;

    this.expandedStudentId = null;

    this.fetch(1);
  }


  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.currentPage
    ) {
      return;
    }

    this.fetch(page);
  }


  previousPage(): void {

    if (this.currentPage <= 1) {
      return;
    }

    this.fetch(this.currentPage - 1);
  }


  nextPage(): void {

    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.fetch(this.currentPage + 1);
  }


  onPageSizeChange(): void {

    this.currentPage = 1;

    this.expandedStudentId = null;

    this.fetch(1);
  }


  // =====================================================
  // INITIALS
  // =====================================================

  initials(
    s: Student
  ): string {

    const parts =
      s.fullName
        .trim()
        .split(/\s+/);

    const first =
      parts[0]?.[0] ?? '';

    const last =
      parts.length > 1
        ? parts[parts.length - 1][0]
        : '';

    return (
      first + last
    ).toUpperCase();
  }


  // =====================================================
  // STUDENT EXPANSION
  // =====================================================

  toggleStudent(
    student: Student
  ): void {

    if (
      this.expandedStudentId ===
      student.id
    ) {

      this.expandedStudentId = null;

      this.cdr.detectChanges();

      return;
    }


    this.expandedStudentId =
      student.id;


    if (
      !this.studentDetails[
        student.id
      ]
    ) {

      this.studentDetails[
        student.id
      ] = {

        loading: true,

        error: '',

        exams: [],

        attendance: [],
      };

      this.loadStudentDetails(
        student.id
      );
    }


    this.cdr.detectChanges();
  }


  isExpanded(
    studentId: number
  ): boolean {

    return (
      this.expandedStudentId ===
      studentId
    );
  }


  getDetails(
    studentId: number
  ): StudentDetails {

    return (
      this.studentDetails[
        studentId
      ] ?? {

        loading: true,

        error: '',

        exams: [],

        attendance: [],
      }
    );
  }


  // =====================================================
  // LOAD EXPANDED STUDENT DATA
  // =====================================================

  private loadStudentDetails(
    studentId: number
  ): void {

    const details =
      this.studentDetails[
        studentId
      ];


    const today =
      this.startOfDay(
        new Date()
      );


    const from =
      this.addDays(
        today,
        -6
      );


    const exams$ =
      this.studentsService
        .getExamResults(
          studentId
        );


    const attendance$ =
      this.studentsService
        .getAttendance(
          studentId,
          from,
          today
        );


    let examsLoaded = false;
    let attendanceLoaded = false;

    let failed = false;


    exams$.subscribe({

      next: (exams) => {

        details.exams =
          this.normalizeExamResults(
            exams
          );

        examsLoaded = true;

        this.finishDetailsLoad(
          details,
          examsLoaded,
          attendanceLoaded,
          failed
        );
      },

      error: (err) => {

        console.error(
          `Failed to load exam results for student ${studentId}:`,
          err
        );

        failed = true;

        details.error =
          'Some student details could not be loaded.';

        examsLoaded = true;

        this.finishDetailsLoad(
          details,
          examsLoaded,
          attendanceLoaded,
          failed
        );
      },
    });


    attendance$.subscribe({

      next: (attendance) => {

        details.attendance =
          attendance ?? [];

        attendanceLoaded = true;

        this.finishDetailsLoad(
          details,
          examsLoaded,
          attendanceLoaded,
          failed
        );
      },

      error: (err) => {

        console.error(
          `Failed to load attendance for student ${studentId}:`,
          err
        );

        failed = true;

        details.error =
          'Some student details could not be loaded.';

        attendanceLoaded = true;

        this.finishDetailsLoad(
          details,
          examsLoaded,
          attendanceLoaded,
          failed
        );
      },
    });
  }


  private finishDetailsLoad(
    details: StudentDetails,
    examsLoaded: boolean,
    attendanceLoaded: boolean,
    failed: boolean
  ): void {

    if (
      !examsLoaded ||
      !attendanceLoaded
    ) {

      return;
    }


    details.loading = false;


    if (!failed) {
      details.error = '';
    }


    this.cdr.detectChanges();
  }


  // =====================================================
  // EXAM RESULT NORMALIZATION
  // =====================================================

  private normalizeExamResults(
    exams: StudentExamResult[]
  ): StudentExamResult[] {

    return (exams ?? []).map(
      (exam) => {

        const nested =
          exam.exam;


        return {

          ...exam,

          examName:
            exam.examName ??
            nested?.name ??
            null,

          subjectName:
            exam.subjectName ??
            nested?.subjectName ??
            null,

          gradeName:
            exam.gradeName ??
            nested?.gradeName ??
            null,

          examDate:
            exam.examDate ??
            nested?.examDate ??
            null,

          maxScore:
            exam.maxScore ??
            nested?.maxScore ??
            null,
        };
      }
    );
  }


  // =====================================================
  // EXAM HELPERS
  // =====================================================

  examName(
    exam: StudentExamResult
  ): string {

    return (
      exam.examName ??
      exam.exam?.name ??
      'Exam'
    );
  }


  examSubject(
    exam: StudentExamResult
  ): string {

    return (
      exam.subjectName ??
      exam.exam?.subjectName ??
      '—'
    );
  }


  examGrade(
    exam: StudentExamResult
  ): string {

    return (
      exam.gradeName ??
      exam.exam?.gradeName ??
      '—'
    );
  }


  examScore(
    exam: StudentExamResult
  ): string {

    if (
      exam.score === null ||
      exam.score === undefined
    ) {

      return 'Not graded';
    }


    const max =
      exam.maxScore ??
      exam.exam?.maxScore ??
      100;


    return `${this.formatNumber(exam.score)} / ${this.formatNumber(max)}`;
  }


  examPercentage(
    exam: StudentExamResult
  ): number | null {

    if (
      exam.score === null ||
      exam.score === undefined
    ) {

      return null;
    }


    const max =
      exam.maxScore ??
      exam.exam?.maxScore ??
      0;


    if (max <= 0) {
      return null;
    }


    return (
      exam.score / max
    ) * 100;
  }


  examPercentageText(
    exam: StudentExamResult
  ): string {

    const percentage =
      this.examPercentage(
        exam
      );


    if (percentage === null) {
      return '—';
    }


    return `${percentage.toFixed(1)}%`;
  }


  private formatNumber(
    value: number
  ): string {

    return Number.isInteger(value)
      ? value.toString()
      : value.toFixed(1);
  }


  // =====================================================
  // ATTENDANCE
  // =====================================================

  getAttendanceDays(
    studentId: number
  ): AttendanceDay[] {

    const details =
      this.getDetails(
        studentId
      );


    const today =
      this.startOfDay(
        new Date()
      );


    const attendanceByDate =
      new Map<
        string,
        StudentAttendanceRecord
      >();


    for (
      const record of details.attendance
    ) {

      const date =
        this.startOfDay(
          new Date(
            record.date
          )
        );


      attendanceByDate.set(
        this.dateKey(date),
        record
      );
    }


    const days:
      AttendanceDay[] = [];


    for (
      let offset = 0;
      offset < 7;
      offset++
    ) {

      const date =
        this.addDays(
          today,
          -offset
        );


      const isWeekend =
        this.isWeekend(
          date
        );


      days.push({

        date,

        record:
          attendanceByDate.get(
            this.dateKey(date)
          ) ?? null,

        isWeekend,
      });
    }


    return days;
  }

  attendanceStatus(
    record:
      StudentAttendanceRecord | null
  ): string {

    if (!record) {
      return 'Not recorded';
    }

    const raw = record.status;

    if (typeof raw === 'string') {
      const normalized = raw
        .trim()
        .toLowerCase();

      switch (normalized) {
        case 'unrecorded':
          return 'Not recorded';

        case 'present':
          return 'Present';

        case 'absent':
          return 'Absent';

        case 'late':
          return 'Late';

        case 'excused':
          return 'Excused';

        default:
          return 'Not recorded';
      }
    }

    switch (raw) {

      case 0:
        return 'Not recorded';

      case 1:
        return 'Present';

      case 2:
        return 'Absent';

      case 3:
        return 'Late';

      case 4:
        return 'Excused';

      default:
        return 'Not recorded';
    }
  }


  attendanceClass(
    day: AttendanceDay
  ): string {

    if (day.isWeekend) {
      return 'weekend';
    }


    const status =
      this.attendanceStatus(
        day.record
      ).toLowerCase();


    if (
      status === 'present'
    ) {

      return 'present';
    }


    if (
      status === 'late'
    ) {

      return 'late';
    }


    if (
      status === 'absent'
    ) {

      return 'absent';
    }


    if (
      status === 'excused'
    ) {

      return 'excused';
    }


    return 'unrecorded';
  }


  attendanceIcon(
    day: AttendanceDay
  ): string {

    if (day.isWeekend) {
      return '—';
    }


    const status =
      this.attendanceStatus(
        day.record
      ).toLowerCase();


    if (
      status === 'present'
    ) {

      return '✓';
    }


    if (
      status === 'late'
    ) {

      return '~';
    }


    if (
      status === 'absent'
    ) {

      return '×';
    }


    if (
      status === 'excused'
    ) {

      return 'E';
    }


    return '•';
  }


  attendanceDate(
    date: Date
  ): string {

    return date.toLocaleDateString(
      'en-US',
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }
    );
  }


  attendanceTime(
    value: string | null
  ): string {

    if (!value) {
      return '';
    }


    return value
      .replace(
        /^.*T/,
        ''
      )
      .substring(
        0,
        5
      );
  }


  // =====================================================
  // DATE HELPERS
  // =====================================================

  private startOfDay(
    date: Date
  ): Date {

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  }


  private addDays(
    date: Date,
    amount: number
  ): Date {

    const result =
      new Date(date);

    result.setDate(
      result.getDate() + amount
    );

    return this.startOfDay(
      result
    );
  }


  private dateKey(
    date: Date
  ): string {

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }


  private isWeekend(
    date: Date
  ): boolean {

    return (
      date.getDay() === 5 ||
      date.getDay() === 6
    );
  }


  private capitalize(
    value: string
  ): string {

    if (!value) {
      return value;
    }

    return (
      value.charAt(0).toUpperCase() +
      value.slice(1).toLowerCase()
    );
  }


  // =====================================================
  // MODAL
  // =====================================================

  openAddModal(): void {

    this.modalMode = 'create';

    this.selectedStudent = null;

    this.showModal = true;

    this.cdr.detectChanges();
  }


  openEditModal(
    s: Student
  ): void {

    this.modalMode = 'edit';

    this.selectedStudent = s;

    this.showModal = true;

    this.cdr.detectChanges();
  }


  closeModal(): void {

    this.showModal = false;

    this.selectedStudent = null;

    this.cdr.detectChanges();
  }


  onSaved(): void {

    this.closeModal();

    this.fetch(this.currentPage);
  }


  // =====================================================
  // DELETE
  // =====================================================

  confirmDelete(
    id: number
  ): void {

    this.pendingDeleteId = id;

    this.cdr.detectChanges();
  }


  cancelDelete(): void {

    this.pendingDeleteId = null;

    this.cdr.detectChanges();
  }


  deleteStudent(
    id: number
  ): void {

    this.studentsService
      .delete(id)
      .subscribe({

        next: () => {

          this.pendingDeleteId =
            null;

          this.fetch(this.currentPage);
        },

        error: (err) => {

          console.error(
            'Failed to delete student:',
            err
          );

          this.pendingDeleteId =
            null;

          this.cdr.detectChanges();
        },
      });
  }
}