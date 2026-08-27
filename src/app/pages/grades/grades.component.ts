import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { Grade } from '../../models/grade';
import { Subject } from '../../models/subject';
import { GradesService } from '../../services/grades.service';
import { SubjectsService } from '../../services/subjects.service';
import { GradeSubjectsService, GradeSubject } from '../../services/grade-subjects.service';
import { GradeFormModalComponent } from './grade-form-modal.component';

interface GradeView extends Grade {
  subjects: Subject[];
  gradeSubjects: GradeSubject[];
  subjectsLoading: boolean;
}

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, GradeFormModalComponent],
  templateUrl: './grades.component.html',
  styleUrl: './grades.component.scss',
})
export class GradesComponent implements OnInit, OnDestroy {
  grades: GradeView[] = [];
  allSubjects: Subject[] = [];
  loading = true;
  error = '';
  searchTerm = '';

  pageSize = 20;
  currentPage = 1;
  totalCount = 0;
  totalPages = 0;
  hasPreviousPage = false;
  hasNextPage = false;

  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedGrade: Grade | null = null;
  pendingDeleteId: number | null = null;
  changingSubject = false;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private gradesService: GradesService,
    private subjectsService: SubjectsService,
    private gradeSubjectsService: GradeSubjectsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load(1);
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  load(page = this.currentPage): void {
    this.loading = true;
    this.error = '';

    this.gradesService.getAll(page, this.pageSize, this.searchTerm).subscribe({
      next: result => {
        this.grades = result.grades.map(g => ({
          ...g,
          subjects: [],
          gradeSubjects: [],
          subjectsLoading: true
        }));

        this.currentPage = result.page;
        this.pageSize = result.pageSize;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.hasPreviousPage = result.hasPreviousPage;
        this.hasNextPage = result.hasNextPage;

        this.cdr.detectChanges();

        this.subjectsService.getAll().subscribe({
          next: subjects => {
            this.allSubjects = subjects;
            this.loadGradeSubjects();
          },
          error: err => {
            console.error('Failed to load subjects:', err);
            this.error = 'Could not load subjects.';
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: err => {
        console.error('Failed to load grades:', err);
        this.error = 'Could not load grades. Is the API running on localhost:5216?';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      this.currentPage = 1;
      this.load(1);
    }, 300);
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.load(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.load(page);
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

  private loadGradeSubjects(): void {
    if (!this.grades.length) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    let remaining = this.grades.length;

    this.grades.forEach(grade => {
      this.gradeSubjectsService.getForGrade(grade.id).subscribe({
        next: links => {
          grade.gradeSubjects = links;
          const ids = new Set(links.map(x => x.subjectId));
          grade.subjects = this.allSubjects.filter(s => ids.has(s.id));
          grade.subjectsLoading = false;
          remaining--;
          if (remaining === 0) this.loading = false;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error(`Failed to load subjects for grade ${grade.id}:`, err);
          grade.subjectsLoading = false;
          remaining--;
          if (remaining === 0) this.loading = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  // Kept because the existing HTML used this name.
  // Search and pagination now happen on the backend.
  get filtered(): GradeView[] {
    return this.grades;
  }

  availableSubjects(grade: GradeView): Subject[] {
    const assigned = new Set(grade.gradeSubjects.map(x => x.subjectId));
    return this.allSubjects.filter(s => !assigned.has(s.id));
  }

  addSubject(grade: GradeView, event: Event): void {
    if (this.changingSubject) return;

    const select = event.target as HTMLSelectElement;
    const subjectId = Number(select.value);

    if (!subjectId) {
      return;
    }

    this.changingSubject = true;

    this.gradeSubjectsService.add(grade.id, subjectId).subscribe({
      next: (link) => {
        grade.gradeSubjects = [...grade.gradeSubjects, link];

        const subject = this.allSubjects.find(
          (s) => s.id === subjectId
        );

        if (subject) {
          grade.subjects = [...grade.subjects, subject].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
        }

        select.value = '';
        this.changingSubject = false;
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Failed to add subject to grade:', err);
        console.error('Grade ID:', grade.id);
        console.error('Subject ID:', subjectId);

        select.value = '';
        this.changingSubject = false;
        this.cdr.detectChanges();
      },
    });
  }

  removeSubject(grade: GradeView, link: GradeSubject): void {
    if (this.changingSubject) return;
    this.changingSubject = true;

    this.gradeSubjectsService.remove(link.id).subscribe({
      next: () => {
        grade.gradeSubjects = grade.gradeSubjects.filter(x => x.id !== link.id);
        grade.subjects = grade.subjects.filter(s => s.id !== link.subjectId);
        this.changingSubject = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to remove subject:', err);
        this.changingSubject = false;
        this.cdr.detectChanges();
      }
    });
  }

  openAddModal(): void {
    this.modalMode = 'create';
    this.selectedGrade = null;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(grade: GradeView): void {
    this.modalMode = 'edit';
    this.selectedGrade = grade;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedGrade = null;
    this.cdr.detectChanges();
  }

  onSaved(): void {
    this.closeModal();
    this.load(this.currentPage);
  }

  confirmDelete(id: number): void {
    this.pendingDeleteId = id;
    this.cdr.detectChanges();
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
    this.cdr.detectChanges();
  }

  deleteGrade(id: number): void {
    this.gradesService.delete(id).subscribe({
      next: () => {
        const targetPage =
          this.grades.length === 1 && this.currentPage > 1
            ? this.currentPage - 1
            : this.currentPage;

        this.pendingDeleteId = null;
        this.load(targetPage);
      },
      error: err => {
        console.error('Failed to delete grade:', err);
        this.pendingDeleteId = null;
        this.error = 'Could not delete grade. It may still have dependent records.';
        this.cdr.detectChanges();
      }
    });
  }
}