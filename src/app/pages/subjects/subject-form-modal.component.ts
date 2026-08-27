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

  constructor(private subjectsService: SubjectsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.resetFormFromInput(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['subject'] || changes['mode']) this.resetFormFromInput();
  }

  get title(): string { return this.mode === 'edit' ? 'Edit subject' : 'Add subject'; }

  submit(): void {
    if (!this.name.trim()) {
      this.error = 'Subject name is required.';
      return;
    }

    this.saving = true;
    this.error = '';

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

  private handleSaveError(err: unknown): void {
    console.error('Failed to save subject:', err);
    this.saving = false;
    this.error = 'Could not save subject. Check the name and try again.';
    this.cdr.detectChanges();
  }

  cancel(): void { this.closed.emit(); }

  private resetFormFromInput(): void {
    this.name = this.mode === 'edit' && this.subject ? this.subject.name : '';
    this.error = '';
  }
}
