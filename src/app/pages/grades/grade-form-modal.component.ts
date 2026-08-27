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

  constructor(private gradesService: GradesService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.resetFormFromInput(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['grade'] || changes['mode']) this.resetFormFromInput();
  }

  get title(): string { return this.mode === 'edit' ? 'Edit grade' : 'Add grade'; }

  submit(): void {
    if (!this.name.trim()) {
      this.error = 'Grade name is required.';
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

  private handleSaveError(err: unknown): void {
    console.error('Failed to save grade:', err);
    this.saving = false;
    this.error = 'Could not save grade. Check the fields and try again.';
    this.cdr.detectChanges();
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
  }
}
