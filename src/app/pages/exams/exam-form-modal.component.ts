import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalComponent } from '../../shared/modal/modal.component';

import {
  Exam,
  ExamPayload,
} from '../../models/exam';

import { ExamService } from '../../services/exams.service';
import { SubjectsService } from '../../services/subjects.service';
import { GradesService } from '../../services/grades.service';
import {
  GradeSubjectsService,
  GradeSubject,
} from '../../services/grade-subjects.service';

import { Subject } from '../../models/subject';
import { Grade } from '../../models/grade';

@Component({
  selector: 'app-exam-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
  ],
  templateUrl: './exam-form-modal.component.html',
  styleUrl: './exam-form-modal.component.scss',
})
export class ExamFormModalComponent
  implements OnInit, OnChanges {

  @Input() mode: 'create' | 'edit' = 'create';
  @Input() exam: Exam | null = null;

  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  // All subjects loaded from the database.
  // Used to filter the dropdown.
  allSubjects: Subject[] = [];

  // Only subjects belonging to the selected grade.
  subjects: Subject[] = [];

  grades: Grade[] = [];

  subjectsLoading = true;
  gradesLoading = true;

  name = '';
  subjectId: number | null = null;
  gradeId: number | null = null;
  examDate = '';
  maxScore: number | null = 100;

  saving = false;
  error = '';

  constructor(
    private examService: ExamService,
    private subjectsService: SubjectsService,
    private gradesService: GradesService,
    private gradeSubjectsService: GradeSubjectsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadSubjects();
    this.loadGrades();
    this.resetForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['exam'] ||
      changes['mode']
    ) {
      this.resetForm();

      // If the component is being opened in edit mode
      // and the grade is already known, load the
      // subjects belonging to that grade.
      if (
        this.mode === 'edit' &&
        this.gradeId !== null &&
        this.allSubjects.length > 0
      ) {
        this.loadSubjectsForGrade(
          this.gradeId,
          this.subjectId,
        );
      }
    }
  }

  get title(): string {
    return this.mode === 'edit'
      ? 'Edit exam'
      : 'Create exam';
  }

  /**
   * Load every subject once.
   *
   * We don't put these directly into the dropdown.
   * The dropdown is populated by loadSubjectsForGrade()
   * after a Grade is selected.
   */
  private loadSubjects(): void {
    this.subjectsLoading = true;

    this.subjectsService.getAll().subscribe({
      next: subjects => {
        this.allSubjects = [...subjects].sort(
          (a, b) =>
            a.name.localeCompare(b.name)
        );

        // Don't show subjects until a grade
        // has been selected.
        this.subjects = [];

        this.subjectsLoading = false;

        // Edit mode:
        // load only the subjects valid for
        // the existing grade.
        if (
          this.mode === 'edit' &&
          this.gradeId !== null
        ) {
          this.loadSubjectsForGrade(
            this.gradeId,
            this.subjectId,
          );
        }

        this.cdr.detectChanges();
      },

      error: err => {
        console.error(
          'Failed to load subjects:',
          err
        );

        this.subjectsLoading = false;
        this.error =
          'Could not load subjects.';

        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Load all grades.
   */
  private loadGrades(): void {
    this.gradesLoading = true;

    this.gradesService.getAll(1, 100).subscribe({
      next: result => {
        this.grades = [...result.grades].sort(
          (a, b) =>
            a.number - b.number
        );

        this.gradesLoading = false;

        // Edit mode:
        // If subjects have already loaded,
        // populate the subject dropdown now.
        if (
          this.mode === 'edit' &&
          this.gradeId !== null &&
          this.allSubjects.length > 0
        ) {
          this.loadSubjectsForGrade(
            this.gradeId,
            this.subjectId,
          );
        }

        this.cdr.detectChanges();
      },

      error: err => {
        console.error(
          'Failed to load grades:',
          err
        );

        this.gradesLoading = false;
        this.error =
          'Could not load grades.';

        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Called whenever the Grade dropdown changes.
   *
   * A new grade means the previously selected
   * subject is no longer necessarily valid, so
   * clear it and reload the valid subjects.
   */
  onGradeChange(): void {
    this.error = '';

    if (this.gradeId === null) {
      this.subjects = [];
      this.subjectId = null;
      this.subjectsLoading = false;

      this.cdr.detectChanges();
      return;
    }

    // Clear the previous subject immediately.
    this.subjectId = null;

    this.loadSubjectsForGrade(
      this.gradeId,
    );
  }

  /**
   * Gets the GradeSubject relationships for a grade,
   * then filters all database subjects to only those
   * linked to that grade.
   */
  private loadSubjectsForGrade(
    gradeId: number,
    existingSubjectId: number | null = null,
  ): void {
    this.subjectsLoading = true;
    this.subjects = [];

    this.gradeSubjectsService
      .getForGrade(gradeId)
      .subscribe({
        next: (links: GradeSubject[]) => {
          const subjectIds = new Set(
            links.map(
              link => link.subjectId
            )
          );

          this.subjects =
            this.allSubjects
              .filter(subject =>
                subjectIds.has(
                  subject.id
                )
              )
              .sort((a, b) =>
                a.name.localeCompare(b.name)
              );

          this.subjectsLoading = false;

          /*
           * Edit mode:
           *
           * Keep the existing subject only if
           * it actually belongs to the selected grade.
           */
          if (
            existingSubjectId !== null &&
            this.subjects.some(
              subject =>
                subject.id ===
                existingSubjectId
            )
          ) {
            this.subjectId =
              existingSubjectId;
          } else {
            this.subjectId = null;
          }

          this.cdr.detectChanges();
        },

        error: err => {
          console.error(
            'Failed to load subjects for grade:',
            err
          );

          this.subjects = [];
          this.subjectId = null;
          this.subjectsLoading = false;

          this.error =
            'Could not load subjects for this grade.';

          this.cdr.detectChanges();
        },
      });
  }

  submit(): void {
    if (!this.name.trim()) {
      this.error =
        'Exam name is required.';
      return;
    }

    if (this.gradeId === null) {
      this.error =
        'Grade is required.';
      return;
    }

    if (this.subjectId === null) {
      this.error =
        'Subject is required.';
      return;
    }

    /*
     * Extra client-side protection:
     *
     * Make sure the selected subject actually
     * belongs to the selected grade.
     */
    if (
      !this.subjects.some(
        subject =>
          subject.id ===
          this.subjectId
      )
    ) {
      this.error =
        'The selected subject is not available for this grade.';
      return;
    }

    if (
      this.maxScore === null ||
      this.maxScore <= 0
    ) {
      this.error =
        'Max score must be greater than 0.';
      return;
    }

    this.saving = true;
    this.error = '';

    const payload: ExamPayload = {
      name: this.name.trim(),
      subjectId: this.subjectId,
      gradeId: this.gradeId,
      examDate: this.examDate
        ? this.examDate
        : null,
      maxScore: this.maxScore,
    };

    if (
      this.mode === 'edit' &&
      this.exam
    ) {
      this.examService
        .update(
          this.exam.id,
          payload
        )
        .subscribe({
          next: () =>
            this.handleSuccess(),

          error: err =>
            this.handleError(err),
        });
    } else {
      this.examService
        .create(payload)
        .subscribe({
          next: () =>
            this.handleSuccess(),

          error: err =>
            this.handleError(err),
        });
    }
  }

  private handleSuccess(): void {
    this.saving = false;
    this.saved.emit();
    this.cdr.detectChanges();
  }

  private handleError(
    err: unknown
  ): void {
    console.error(
      'Failed to save exam:',
      err
    );

    this.saving = false;

    this.error =
      'Could not save exam. Check that the subject is available for the selected grade.';

    this.cdr.detectChanges();
  }

  cancel(): void {
    this.closed.emit();
  }

  private resetForm(): void {
    if (
      this.mode === 'edit' &&
      this.exam
    ) {
      this.name =
        this.exam.title;

      this.subjectId =
        this.exam.subjectId;

      this.gradeId =
        this.exam.gradeId;

      this.examDate =
        this.toDateInputValue(
          this.exam.examDate
        );

      this.maxScore =
        this.exam.maxScore;

      /*
       * Don't immediately put all subjects into
       * the dropdown. loadSubjectsForGrade()
       * will populate it after the Grade is known.
       */
      this.subjects = [];
    } else {
      this.name = '';
      this.subjectId = null;
      this.gradeId = null;
      this.examDate = '';
      this.maxScore = 100;

      this.subjects = [];
    }

    this.error = '';
  }

  private toDateInputValue(
    date: Date | null,
  ): string {
    if (!date) return '';

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
}