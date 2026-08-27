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
import { Student, StudentPayload } from '../../models/student';
import { StudentsService } from '../../services/students.service';
import { SchoolClass } from '../../models/school-class';
import { ClassesService } from '../../services/classes.service';

@Component({
  selector: 'app-student-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './student-form-modal.component.html',
  styleUrl: './student-form-modal.component.scss',
})
export class StudentFormModalComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() student: Student | null = null;

  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  classes: SchoolClass[] = [];
  classesLoading = true;

  fullName = '';
  code = '';
  dateOfBirth = ''; // yyyy-MM-dd, matches <input type="date">
  enrollDate = '';
  classId: number | null = null;

  saving = false;
  error = '';
  codeError = '';

  constructor(
    private studentsService: StudentsService,
    private classesService: ClassesService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadClasses();
    this.resetFormFromInput();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['student'] || changes['mode']) {
      this.resetFormFromInput();
    }
  }

  get title(): string {
    return this.mode === 'edit' ? 'Edit student' : 'Add student';
  }

  loadClasses(): void {
    this.classesLoading = true;
    this.classesService.getAll(1, 100).subscribe({
      next: (result) => {
        this.classes = result.classes;
        this.classesLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load classes for dropdown:', err);
        this.classesLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  submit(): void {
    this.error = '';
    this.codeError = '';

    if (!this.fullName.trim() || !this.code.trim()) {
      this.error = 'Full name and code are required.';
      return;
    }

    if (
      this.dateOfBirth &&
      this.enrollDate &&
      this.enrollDate < this.dateOfBirth
    ) {
      this.error =
        'Enrollment date cannot be earlier than date of birth.';
      return;
    }

    this.saving = true;

    const payload: StudentPayload = {
      fullName: this.fullName.trim(),
      code: this.code.trim(),
      dateOfBirth: this.dateOfBirth || null,
      enrollDate: this.enrollDate || null,
      classId: this.classId,
    };

    if (this.mode === 'edit' && this.student) {
      this.studentsService.update(this.student.id, payload).subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err: unknown) => this.handleSaveError(err),
      });
    } else {
      this.studentsService.create(payload).subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err: unknown) => this.handleSaveError(err),
      });
    }
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.saved.emit();
    this.cdr.detectChanges();
  }

  private handleSaveError(err: any): void {
    console.error('Failed to save student:', err);

    this.saving = false;
    this.error = '';
    this.codeError = '';

    const backendMessage = this.extractErrorMessage(err);

    if (
      backendMessage
        .toLowerCase()
        .includes('student code') ||
      backendMessage
        .toLowerCase()
        .includes('code is already') ||
      backendMessage
        .toLowerCase()
        .includes('code already')
    ) {
      this.codeError =
        'This student code is already in use. Choose a different code.';
    } else if (backendMessage) {
      this.error = backendMessage;
    } else {
      this.error =
        'Could not save student details. Please check the form and try again.';
    }

    this.cdr.detectChanges();
  }

  private extractErrorMessage(err: any): string {
    const body = err?.error;

    if (typeof body === 'string') {
      return body;
    }

    const directMessage =
      body?.message ??
      body?.detail ??
      body?.title ??
      err?.message;

    if (
      typeof directMessage === 'string' &&
      directMessage.trim()
    ) {
      return directMessage.trim();
    }

    const validationErrors =
      body?.errors;

    if (
      validationErrors &&
      typeof validationErrors === 'object'
    ) {
      const messages = Object.values(validationErrors)
        .flatMap((value: any) =>
          Array.isArray(value)
            ? value
            : [value]
        )
        .filter(
          (value): value is string =>
            typeof value === 'string' &&
            value.trim().length > 0
        );

      if (messages.length > 0) {
        return messages.join(' ');
      }
    }

    return '';
  }

  cancel(): void {
    this.closed.emit();
  }

  private resetFormFromInput(): void {
    if (this.mode === 'edit' && this.student) {
      this.fullName = this.student.fullName;
      this.code = this.student.code;
      this.dateOfBirth = this.toDateInputValue(this.student.dateOfBirth);
      this.enrollDate = this.toDateInputValue(this.student.enrollDate);
      this.classId = this.student.classId;
    } else {
      this.fullName = '';
      this.code = '';
      this.dateOfBirth = '';
      this.enrollDate = '';
      this.classId = null;
    }
    this.error = '';
    this.codeError = '';
  }

  onCodeChange(): void {
    this.codeError = '';
  }


  private toDateInputValue(d: Date | null): string {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}