import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { ClassFormModalComponent } from './class-form-modal.component';
import { SchoolClass } from '../../models/school-class';
import { ClassesService } from '../../services/classes.service';
import { ModalComponent } from '../../shared/modal/modal.component';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ClassFormModalComponent, ModalComponent],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.scss',
})
export class ClassesComponent implements OnInit, OnDestroy {
  classes: SchoolClass[] = [];
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
  selectedClass: SchoolClass | null = null;

  pendingDeleteId: number | null = null;

  showRosterModal = false;
  rosterClass: SchoolClass | null = null;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private classesService: ClassesService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.fetch(1);
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    document.body.style.overflow = '';
  }

  fetch(page = this.currentPage): void {
    this.loading = true;
    this.error = '';

    this.classesService
      .getAll(page, this.pageSize, this.searchTerm)
      .subscribe({
        next: (data) => {
          this.classes = data.classes;
          this.currentPage = data.page;
          this.pageSize = data.pageSize;
          this.totalCount = data.totalCount;
          this.totalPages = data.totalPages;
          this.hasPreviousPage = data.hasPreviousPage;
          this.hasNextPage = data.hasNextPage;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load classes:', err);
          this.error = 'Could not load classes. Is the API running on localhost:5216?';
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

  // Kept because the existing template used this name.
  // Filtering now happens on the backend.
  get filtered(): SchoolClass[] {
    return this.classes;
  }

  previewNames(c: SchoolClass, limit = 4): string[] {
    return c.studentNames.slice(0, limit);
  }

  overflowCount(c: SchoolClass, limit = 4): number {
    return Math.max(0, c.studentNames.length - limit);
  }

  openRoster(c: SchoolClass): void {
    this.rosterClass = c;
    this.showRosterModal = true;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
  }

  closeRoster(): void {
    this.showRosterModal = false;
    this.rosterClass = null;
    document.body.style.overflow = '';
    this.cdr.detectChanges();
  }

  openAddModal(): void {
    this.modalMode = 'create';
    this.selectedClass = null;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(c: SchoolClass): void {
    this.modalMode = 'edit';
    this.selectedClass = c;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedClass = null;
    this.cdr.detectChanges();
  }

  onSaved(): void {
    this.closeModal();
    this.fetch(this.currentPage);
  }

  confirmDelete(id: number): void {
    this.pendingDeleteId = id;
    this.cdr.detectChanges();
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
    this.cdr.detectChanges();
  }

  deleteClass(id: number): void {
    this.classesService.delete(id).subscribe({
      next: () => {
        const targetPage =
          this.classes.length === 1 && this.currentPage > 1
            ? this.currentPage - 1
            : this.currentPage;

        this.pendingDeleteId = null;
        this.fetch(targetPage);
      },
      error: (err) => {
        console.error('Failed to delete class:', err);
        this.pendingDeleteId = null;
        this.cdr.detectChanges();
      },
    });
  }
}