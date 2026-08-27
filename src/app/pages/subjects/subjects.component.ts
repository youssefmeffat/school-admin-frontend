import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { Subject } from '../../models/subject';
import { SubjectsService } from '../../services/subjects.service';
import { TeachingAssignment } from '../../models/teaching-assignment';
import { TeachingAssignmentsService } from '../../services/teaching-assignments.service';
import { SubjectFormModalComponent } from './subject-form-modal.component';

interface SubjectView extends Subject {
  assignments: TeachingAssignment[];
}

interface GradeGroup {
  gradeId: number;
  gradeName: string;
  classes: { classId: number; className: string; teachers: string[] }[];
}

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, SubjectFormModalComponent],
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.scss',
})
export class SubjectsComponent implements OnInit {
  subjects: SubjectView[] = [];
  loading = true;
  error = '';
  searchTerm = '';
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedSubject: Subject | null = null;
  pendingDeleteId: number | null = null;
  expandedId: number | null = null;

  constructor(
    private subjectsService: SubjectsService,
    private assignmentsService: TeachingAssignmentsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void { this.fetch(); }

  fetch(): void {
    this.loading = true;
    this.error = '';

    this.subjectsService.getAll().subscribe({
      next: subjects => {
        this.subjects = subjects.map(s => ({ ...s, assignments: [] }));

        if (!this.subjects.length) {
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        let remaining = this.subjects.length;

        this.subjects.forEach(subject => {
          this.assignmentsService.getForSubject(subject.id).subscribe({
            next: assignments => {
              subject.assignments = assignments;
              remaining--;
              if (remaining === 0) this.loading = false;
              this.cdr.detectChanges();
            },
            error: err => {
              console.error(`Failed to load assignments for subject ${subject.id}:`, err);
              remaining--;
              if (remaining === 0) this.loading = false;
              this.cdr.detectChanges();
            },
          });
        });
      },
      error: err => {
        console.error('Failed to load subjects:', err);
        this.error = 'Could not load subjects. Is the API running on localhost:5216?';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filtered(): SubjectView[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.subjects;

    return this.subjects.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.assignments.some(a =>
        (a.teacherName ?? '').toLowerCase().includes(term) ||
        (a.gradeName ?? '').toLowerCase().includes(term) ||
        (a.className ?? '').toLowerCase().includes(term)
      )
    );
  }

  teacherNames(subject: SubjectView): string[] {
    return [...new Set(subject.assignments.map(a => a.teacherName).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }

  gradeGroups(subject: SubjectView): GradeGroup[] {
    const groups = new Map<number, GradeGroup>();

    for (const a of subject.assignments) {
      if (!groups.has(a.gradeId)) {
        groups.set(a.gradeId, { gradeId: a.gradeId, gradeName: a.gradeName, classes: [] });
      }

      const grade = groups.get(a.gradeId)!;
      let cls = grade.classes.find(x => x.classId === a.classId);

      if (!cls) {
        cls = { classId: a.classId, className: a.className, teachers: [] };
        grade.classes.push(cls);
      }

      if (!cls.teachers.includes(a.teacherName)) cls.teachers.push(a.teacherName);
    }

    return [...groups.values()]
      .sort((a, b) => a.gradeName.localeCompare(b.gradeName))
      .map(g => ({
        ...g,
        classes: g.classes.sort((a, b) => a.className.localeCompare(b.className)),
      }));
  }

  toggleExpanded(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
    this.cdr.detectChanges();
  }

  openAddModal(): void {
    this.modalMode = 'create';
    this.selectedSubject = null;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(subject: Subject): void {
    this.modalMode = 'edit';
    this.selectedSubject = subject;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedSubject = null;
    this.cdr.detectChanges();
  }

  onSaved(): void {
    this.closeModal();
    this.fetch();
  }

  confirmDelete(id: number): void {
    this.pendingDeleteId = id;
    this.cdr.detectChanges();
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
    this.cdr.detectChanges();
  }

  deleteSubject(id: number): void {
    this.subjectsService.delete(id).subscribe({
      next: () => {
        this.pendingDeleteId = null;
        this.fetch();
      },
      error: err => {
        console.error('Failed to delete subject:', err);
        this.pendingDeleteId = null;
        this.error = 'Could not delete subject. It may still have dependent records.';
        this.cdr.detectChanges();
      },
    });
  }
}
