import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Grade } from '../../models/grade';
import { GradePayload, GradesService } from '../../services/grades.service';

@Component({
  selector: 'app-grade-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './grade-form-modal.component.html',
  styleUrl: './grade-form-modal.component.scss',
})
export class GradeFormModalComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() grade: Grade | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  name = '';
  number: number | null = null;
  description = '';
  saving = false;
  error = '';
  nameError = '';

  constructor(private gradesService: GradesService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.resetFormFromInput(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['grade'] || changes['mode']) this.resetFormFromInput();
  }

  get title(): string { return this.mode === 'edit' ? 'Edit grade' : 'Add grade'; }

  submit(): void {
    this.error = '';
    this.nameError = '';

    if (!this.name.trim()) {
      this.nameError = 'Grade name is required.';
      return;
    }

    if (this.name.trim().length > 10) {
      this.nameError =
        'Grade name cannot be more than 10 characters.';
      return;
    }
    if (this.number === null || this.number < 1) {
      this.error = 'Grade number is required.';
      return;
    }

    this.saving = true;
    this.error = '';

    const payload: GradePayload = {
      name: this.name.trim(),
      number: this.number,
      description: this.description.trim() || null,
    };

    if (this.mode === 'edit' && this.grade) {
      this.gradesService.update(this.grade.id, payload).subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err: unknown) => this.handleSaveError(err),
      });
    } else {
      this.gradesService.create(payload).subscribe({
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

  private handleSaveError(err: any): void {
    console.error('Failed to save grade:', err);

    this.saving = false;
    this.error = '';
    this.nameError = '';

    const backendMessage = this.extractErrorMessage(err);

    if (
      backendMessage
        .toLowerCase()
        .includes('grade') &&
      backendMessage
        .toLowerCase()
        .includes('name') &&
      backendMessage
        .toLowerCase()
        .includes('exists')
    ) {
      this.nameError =
        'A grade with this name already exists.';
    } else if (backendMessage) {
      this.error = backendMessage;
    } else {
      this.error =
        'Could not save grade. Check the fields and try again.';
    }

    this.cdr.detectChanges();
  }

  private extractErrorMessage(err: any): string {
    const body = err?.error;

    if (typeof body === 'string') {
      return body;
    }

    const message =
      body?.message ??
      body?.detail ??
      body?.title ??
      err?.message;

    if (
      typeof message === 'string' &&
      message.trim()
    ) {
      return message.trim();
    }

    const errors = body?.errors;

    if (
      errors &&
      typeof errors === 'object'
    ) {
      const messages = Object.values(errors)
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

  onNameChange(): void {
    this.nameError = '';
  }

  cancel(): void { this.closed.emit(); }

  private resetFormFromInput(): void {
    if (this.mode === 'edit' && this.grade) {
      this.name = this.grade.name;
      this.number = this.grade.number;
      this.description = this.grade.description ?? '';
    } else {
      this.name = '';
      this.number = null;
      this.description = '';
    }
    this.error = '';
    this.nameError = '';
  }
}