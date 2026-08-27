import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Teacher, TeacherPayload } from '../../models/teacher';
import { TeachersService } from '../../services/teachers.service';

@Component({
  selector: 'app-teacher-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './teacher-form-modal.component.html',
  styleUrl: './teacher-form-modal.component.scss',
})
export class TeacherFormModalComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() teacher: Teacher | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  fullName = '';
  email = '';
  code = '';
  saving = false;
  error = '';

  constructor(
    private teachersService: TeachersService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void { this.resetFormFromInput(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['teacher'] || changes['mode']) this.resetFormFromInput();
  }

  get title(): string {
    return this.mode === 'edit' ? 'Edit teacher' : 'Add teacher';
  }

  submit(): void {
    if (!this.fullName.trim()) {
      this.error = 'Teacher name is required.';
      return;
    }

    this.saving = true;
    this.error = '';

    const payload: TeacherPayload = {
      fullName: this.fullName.trim(),
      email: this.email.trim() || null,
      code: this.code.trim() || null,
    };

    if (this.mode === 'edit' && this.teacher) {
      this.teachersService.update(this.teacher.id, payload).subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err: unknown) => this.handleSaveError(err),
      });
    } else {
      this.teachersService.create(payload).subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err: unknown) => this.handleSaveError(err),
      });
    }
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.cdr.detectChanges();
    this.saved.emit();
  }

  private handleSaveError(err: unknown): void {
    console.error('Failed to save teacher:', err);
    this.saving = false;
    this.error = 'Could not save teacher. Check the fields and try again.';
    this.cdr.detectChanges();
  }

  cancel(): void { this.closed.emit(); }

  private resetFormFromInput(): void {
    if (this.mode === 'edit' && this.teacher) {
      this.fullName = this.teacher.fullName;
      this.email = this.teacher.email ?? '';
      this.code = '';
    } else {
      this.fullName = '';
      this.email = '';
      this.code = '';
    }
    this.error = '';
  }
}
