import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Subject } from '../../models/subject';
import { SubjectPayload, SubjectsService } from '../../services/subjects.service';

@Component({
  selector: 'app-subject-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './subject-form-modal.component.html',
  styleUrl: './subject-form-modal.component.scss',
})
export class SubjectFormModalComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() subject: Subject | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  name = '';
  saving = false;
  error = '';
  nameError = '';

  constructor(private subjectsService: SubjectsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.resetFormFromInput(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['subject'] || changes['mode']) this.resetFormFromInput();
  }

  get title(): string { return this.mode === 'edit' ? 'Edit subject' : 'Add subject'; }

  submit(): void {
    this.error = '';
    this.nameError = '';

    if (!this.name.trim()) {
      this.nameError = 'Subject name is required.';
      return;
    }

    if (this.name.trim().length > 25) {
      this.nameError =
        'Subject name cannot be more than 25 characters.';
      return;
    }

    this.saving = true;

    const payload: SubjectPayload = {
      name: this.name.trim(),
    };

    if (this.mode === 'edit' && this.subject) {
      this.subjectsService.update(this.subject.id, payload).subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err: unknown) => this.handleSaveError(err),
      });
    } else {
      this.subjectsService.create(payload).subscribe({
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
    console.error('Failed to save subject:', err);

    this.saving = false;
    this.error = '';
    this.nameError = '';

    const backendMessage =
      this.extractErrorMessage(err);

    const normalized =
      backendMessage.toLowerCase();

    if (
      normalized.includes('subject') &&
      normalized.includes('name') &&
      normalized.includes('exists')
    ) {
      this.nameError =
        'A subject with this name already exists.';
    } else if (
      normalized.includes('subject name') &&
      normalized.includes('25')
    ) {
      this.nameError =
        'Subject name cannot be more than 25 characters.';
    } else if (backendMessage) {
      this.error = backendMessage;
    } else {
      this.error =
        'Could not save subject. Check the name and try again.';
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
    this.name = this.mode === 'edit' && this.subject ? this.subject.name : '';
    this.error = '';
    this.nameError = '';
  }
}