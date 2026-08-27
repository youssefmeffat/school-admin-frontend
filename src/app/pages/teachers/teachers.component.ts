import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

import { Teacher } from '../../models/teacher';
import { TeachingAssignment } from '../../models/teaching-assignment';

import { TeachersService } from '../../services/teachers.service';
import { TeachingAssignmentsService } from '../../services/teaching-assignments.service';

import { TeacherFormModalComponent } from './teacher-form-modal.component';
import { TeachingAssignmentModalComponent } from './teaching-assignment-modal.component';

import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    TeacherFormModalComponent,
    TeachingAssignmentModalComponent,
  ],
  templateUrl: './teachers.component.html',
  styleUrl: './teachers.component.scss',
})
export class TeachersComponent implements OnInit, OnDestroy {
  teachers: Teacher[] = [];

  loading = true;
  error = '';
  searchTerm = '';

  pageSize = 20;
  currentPage = 1;
  totalCount = 0;
  totalPages = 0;
  hasPreviousPage = false;
  hasNextPage = false;

  // Teacher create/edit modal
  showTeacherModal = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedTeacher: Teacher | null = null;

  // Teacher delete
  deletingId: number | null = null;

  // Teaching assignment modal
  showAssignmentModal = false;
  assignmentTeacherId: number | null = null;

  // Teaching assignments, indexed by teacher ID
  teacherAssignments: Record<number, TeachingAssignment[]> = {};

  // Loading state for each teacher's assignments
  assignmentLoading: Record<number, boolean> = {};

  // Assignment currently being deleted
  deletingAssignmentId: number | null = null;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private teachersService: TeachersService,
    private teachingAssignmentsService: TeachingAssignmentsService,
    private confirmDialogService: ConfirmDialogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetch(1);
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  // ---------------------------------------------------------
  // Teachers
  // ---------------------------------------------------------

  fetch(page = this.currentPage): void {
    this.loading = true;
    this.error = '';

    this.teachersService
      .getAll(page, this.pageSize, this.searchTerm)
      .subscribe({
        next: (data) => {
          this.teachers = data.teachers;
          this.currentPage = data.page;
          this.pageSize = data.pageSize;
          this.totalCount = data.totalCount;
          this.totalPages = data.totalPages;
          this.hasPreviousPage = data.hasPreviousPage;
          this.hasNextPage = data.hasNextPage;

          this.loading = false;

          // Only load assignments for teachers on the current backend page.
          for (const teacher of this.teachers) {
            this.loadTeacherAssignments(teacher.id);
          }

          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error('Failed to load teachers:', err);

          this.error =
            'Could not load teachers. Is the API running on localhost:5216?';

          this.loading = false;

          this.cdr.detectChanges();
        },
      });
  }

  onSearchChange(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      this.currentPage = 1;
      this.fetch(1);
    }, 300);
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.fetch(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.fetch(page);
  }

  previousPage(): void {
    if (this.hasPreviousPage) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.goToPage(this.currentPage + 1);
    }
  }

  get pageStart(): number {
    if (this.totalCount === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }

  get pageNumbers(): number[] {
    if (this.totalPages <= 5) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  openCreate(): void {
    this.modalMode = 'create';
    this.selectedTeacher = null;
    this.showTeacherModal = true;

    this.cdr.detectChanges();
  }

  openEdit(teacher: Teacher): void {
    this.modalMode = 'edit';
    this.selectedTeacher = teacher;
    this.showTeacherModal = true;

    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showTeacherModal = false;
    this.selectedTeacher = null;

    this.cdr.detectChanges();
  }

  onSaved(): void {
    this.closeModal();
    this.fetch(this.currentPage);
  }

  async deleteTeacher(teacher: Teacher): Promise<void> {
    if (this.deletingId !== null) return;

    const confirmed = await this.confirmDialogService.confirm({
      title: 'Delete teacher',
      message: `Delete ${teacher.fullName}? This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });

    if (!confirmed) return;

    this.deletingId = teacher.id;
    this.error = '';

    this.teachersService.delete(teacher.id).subscribe({
      next: () => {
        const targetPage =
          this.teachers.length === 1 && this.currentPage > 1
            ? this.currentPage - 1
            : this.currentPage;

        this.deletingId = null;

        // Remove cached assignments for deleted teacher.
        delete this.teacherAssignments[teacher.id];
        delete this.assignmentLoading[teacher.id];

        this.fetch(targetPage);
      },

      error: (err) => {
        console.error('Failed to delete teacher:', err);

        this.error =
          'Could not delete teacher. Please try again.';

        this.deletingId = null;

        this.cdr.detectChanges();
      },
    });
  }

  // ---------------------------------------------------------
  // Search
  // ---------------------------------------------------------

  // Kept because the existing template uses this name.
  // Search is now performed by the backend.
  get filtered(): Teacher[] {
    return this.teachers;
  }

  initials(t: Teacher): string {
    const parts = t.fullName.trim().split(/\s+/);

    const first = parts[0]?.[0] ?? '';

    const last =
      parts.length > 1
        ? parts[parts.length - 1][0]
        : '';

    return (first + last).toUpperCase();
  }

  // ---------------------------------------------------------
  // Teaching Assignments
  // ---------------------------------------------------------

  loadTeacherAssignments(teacherId: number): void {
    this.assignmentLoading[teacherId] = true;

    this.teachingAssignmentsService
      .getForTeacher(teacherId)
      .subscribe({
        next: (assignments) => {
          this.teacherAssignments[teacherId] = assignments;
          this.assignmentLoading[teacherId] = false;

          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error(
            `Failed to load assignments for teacher ${teacherId}:`,
            err
          );

          this.teacherAssignments[teacherId] = [];
          this.assignmentLoading[teacherId] = false;

          this.cdr.detectChanges();
        },
      });
  }

  openAssignmentModal(teacherId: number): void {
    this.assignmentTeacherId = teacherId;
    this.showAssignmentModal = true;

    this.cdr.detectChanges();
  }

  closeAssignmentModal(): void {
    this.showAssignmentModal = false;
    this.assignmentTeacherId = null;

    this.cdr.detectChanges();
  }

  onAssignmentSaved(): void {
    const teacherId = this.assignmentTeacherId;

    this.closeAssignmentModal();

    if (teacherId !== null) {
      this.loadTeacherAssignments(teacherId);
    }
  }

  async removeAssignment(assignment: TeachingAssignment): Promise<void> {
    if (this.deletingAssignmentId !== null) {
      return;
    }

    const confirmed = await this.confirmDialogService.confirm({
      title: 'Unassign teacher',
      message: `Unassign ${assignment.teacherName} as ${assignment.subjectName} teacher from ${assignment.className}?`,
      confirmText: 'Unassign',
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    this.deletingAssignmentId = assignment.id;

    this.teachingAssignmentsService
      .delete(assignment.id)
      .subscribe({
        next: () => {
          this.deletingAssignmentId = null;

          this.loadTeacherAssignments(
            assignment.teacherId
          );
        },

        error: (err) => {
          console.error(
            'Failed to remove teaching assignment:',
            err
          );

          this.error =
            'Could not remove teaching assignment. Please try again.';

          this.deletingAssignmentId = null;

          this.cdr.detectChanges();
        },
      });
  }

  // ---------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------

  getAssignments(teacherId: number): TeachingAssignment[] {
    return this.teacherAssignments[teacherId] ?? [];
  }

  isAssignmentLoading(teacherId: number): boolean {
    return this.assignmentLoading[teacherId] === true;
  }
}