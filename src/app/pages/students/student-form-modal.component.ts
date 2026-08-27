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
    if (!this.fullName.trim() || !this.code.trim()) {
      this.error = 'Full name and code are required.';
      return;
    }

    this.saving = true;
    this.error = '';

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

  private handleSaveError(err: unknown): void {
    console.error('Failed to save student:', err);
    this.saving = false;
    this.error = 'Could not save student. Check the fields and try again.';
    this.cdr.detectChanges();
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
  }

  private toDateInputValue(d: Date | null): string {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}