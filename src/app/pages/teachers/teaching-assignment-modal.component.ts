import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalComponent } from '../../shared/modal/modal.component';

import { Subject } from '../../models/subject';
import { AvailableClass } from '../../services/teaching-assignments.service';
import { SubjectsService } from '../../services/subjects.service';
import { TeachingAssignmentsService } from '../../services/teaching-assignments.service';

@Component({
  selector: 'app-teaching-assignment-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
  ],
  templateUrl: './teaching-assignment-modal.component.html',
  styleUrl: './teaching-assignment-modal.component.scss',
})
export class TeachingAssignmentModalComponent implements OnInit {
  @Input() teacherId!: number;

  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  subjects: Subject[] = [];
  classes: AvailableClass[] = [];

  subjectId: number | null = null;
  classId: number | null = null;

  loadingSubjects = true;
  loadingClasses = false;
  saving = false;

  error = '';

  constructor(
    private subjectsService: SubjectsService,
    private assignmentsService: TeachingAssignmentsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadSubjects();
  }

  private loadSubjects(): void {
    this.loadingSubjects = true;
    this.error = '';

    this.subjectsService.getAll().subscribe({
      next: (subjects) => {
        this.subjects = subjects.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        this.loadingSubjects = false;

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Failed to load subjects:', err);

        this.loadingSubjects = false;
        this.error = 'Could not load subjects.';

        this.cdr.detectChanges();
      },
    });
  }

  onSubjectChange(): void {
    // Always clear the previously selected class
    this.classId = null;
    this.classes = [];
    this.error = '';

    if (this.subjectId === null) {
      return;
    }

    this.loadAvailableClasses(this.subjectId);
  }

  private loadAvailableClasses(subjectId: number): void {
    this.loadingClasses = true;

    this.assignmentsService
      .getAvailableClasses(subjectId)
      .subscribe({
        next: (classes) => {
          this.classes = classes.sort((a, b) => {
            const gradeA = a.gradeName ?? '';
            const gradeB = b.gradeName ?? '';

            const gradeCompare =
              gradeA.localeCompare(gradeB);

            if (gradeCompare !== 0) {
              return gradeCompare;
            }

            return a.name.localeCompare(b.name);
          });

          this.loadingClasses = false;

          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error(
            'Failed to load classes for subject:',
            err
          );

          this.classes = [];
          this.loadingClasses = false;
          this.error =
            'Could not load classes for this subject.';

          this.cdr.detectChanges();
        },
      });
  }

  submit(): void {
    if (this.subjectId === null) {
      this.error = 'Subject is required.';
      return;
    }

    if (this.classId === null) {
      this.error = 'Class is required.';
      return;
    }

    this.saving = true;
    this.error = '';

    this.assignmentsService.create({
      teacherId: this.teacherId,
      subjectId: this.subjectId,
      classId: this.classId,
    }).subscribe({
      next: () => {
        this.saving = false;

        this.saved.emit();

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(
          'Failed to create teaching assignment:',
          err
        );

        this.saving = false;

        if (err?.status === 409) {
          this.error =
            'This teacher is already assigned to this subject and class.';
        } else if (err?.status === 400) {
          this.error =
            err?.error ||
            'This subject is not available for the selected class.';
        } else {
          this.error =
            'Could not create teaching assignment.';
        }

        this.cdr.detectChanges();
      },
    });
  }

  cancel(): void {
    this.closed.emit();
  }
}