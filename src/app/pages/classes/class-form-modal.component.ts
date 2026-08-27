import {
  ChangeDetectorRef, Component, EventEmitter, Input, OnChanges,
  OnInit, Output, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { SchoolClass, ClassPayload } from '../../models/school-class';
import { ClassesService } from '../../services/classes.service';
import { Grade } from '../../models/grade';
import { GradesService } from '../../services/grades.service';
import { Student } from '../../models/student';
import { StudentsService } from '../../services/students.service';

@Component({
  selector: 'app-class-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './class-form-modal.component.html',
  styleUrl: './class-form-modal.component.scss',
})
export class ClassFormModalComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() schoolClass: SchoolClass | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  grades: Grade[] = [];
  gradesLoading = true;
  students: Student[] = [];
  studentsLoading = true;
  studentSearch = '';
  selectedStudentIds = new Set<number>();

  // NOTE: with ~500-600 students seeded, requesting even the server's max
  // page size (100) won't return everyone. This modal's studentSearch box
  // currently only filters whatever page happened to load — it does NOT
  // search the full student body. If a student isn't in the first 100
  // (by Id order), they won't be selectable here no matter what's typed
  // in the search box. The real fix is wiring studentSearch to the
  // backend's `search` query param (same pattern as the Students page),
  // re-fetching on each keystroke/debounce instead of filtering locally.
  // Left as-is for now per "don't make unrelated changes" — flagging so
  // it's a known gap, not a silent one.
  private readonly maxStudentsPageSize = 100;

  name = '';
  gradeId: number | null = null;
  schoolId: number | null = null;
  saving = false;
  error = '';

  constructor(
    private classesService: ClassesService,
    private gradesService: GradesService,
    private studentsService: StudentsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadGrades();
    this.loadStudents();
    this.resetFormFromInput();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schoolClass'] || changes['mode']) this.resetFormFromInput();
  }

  get title(): string {
    return this.mode === 'edit' ? 'Edit class' : 'Add class';
  }

  get filteredStudents(): Student[] {
    const term = this.studentSearch.trim().toLowerCase();
    const list = term
      ? this.students.filter(s =>
          s.fullName.toLowerCase().includes(term) ||
          s.code.toLowerCase().includes(term))
      : this.students;

    return [...list].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  get selectedStudentCount(): number {
    return this.selectedStudentIds.size;
  }

  loadGrades(): void {
    this.gradesLoading = true;
    this.gradesService.getAll(1, 100).subscribe({
      next: result => {
        this.grades = result.grades;
        this.gradesLoading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to load grades:', err);
        this.gradesLoading = false;
        this.error = 'Could not load grade levels.';
        this.cdr.detectChanges();
      }
    });
  }

  loadStudents(): void {
    this.studentsLoading = true;
    // getAll() now returns a paginated result ({ students, page, pageSize,
    // totalCount, ... }), not a bare Student[] — unwrap .students.
    // Requesting the server's max page size (100) as an interim measure;
    // see the maxStudentsPageSize comment above re: the real limitation.
    this.studentsService.getAll(1, this.maxStudentsPageSize).subscribe({
      next: result => {
        this.students = result.students;
        this.studentsLoading = false;
        this.resetSelectedStudents();
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to load students:', err);
        this.studentsLoading = false;
        this.error = 'Could not load registered students.';
        this.cdr.detectChanges();
      }
    });
  }

  isSelected(id: number): boolean {
    return this.selectedStudentIds.has(id);
  }

  toggleStudent(id: number): void {
    if (this.selectedStudentIds.has(id)) this.selectedStudentIds.delete(id);
    else this.selectedStudentIds.add(id);
    this.cdr.detectChanges();
  }

  currentClassName(student: Student): string | null {
    if (student.classId == null || student.classId === this.schoolClass?.id)
      return null;
    return student.className ?? 'another class';
  }

  submit(): void {
    if (!this.name.trim()) {
      this.error = 'Class name is required.';
      return;
    }
    if (this.gradeId === null) {
      this.error = 'Grade level is required.';
      return;
    }

    this.saving = true;
    this.error = '';

    const payload: ClassPayload = {
      name: this.name.trim(),
      gradeId: this.gradeId,
      schoolId: this.schoolId,
    };

    if (this.mode === 'edit' && this.schoolClass) {
      this.classesService.update(this.schoolClass.id, payload).subscribe({
        next: () => this.saveStudents(this.schoolClass!.id),
        error: err => this.handleSaveError(err)
      });
    } else {
      this.classesService.create(payload).subscribe({
        next: created => this.saveStudents(created.id),
        error: err => this.handleSaveError(err)
      });
    }
  }

  private saveStudents(classId: number): void {
    this.classesService.updateStudents(classId, {
      studentIds: [...this.selectedStudentIds]
    }).subscribe({
      next: () => this.handleSaveSuccess(),
      error: err => this.handleSaveError(err)
    });
  }

  private handleSaveSuccess(): void {
    this.saving = false;
    this.cdr.detectChanges();
    this.saved.emit();
  }

  private handleSaveError(err: unknown): void {
    console.error('Failed to save class/student assignments:', err);
    this.saving = false;
    this.error = 'Could not save class or student assignments. Check the fields and try again.';
    this.cdr.detectChanges();
  }

  cancel(): void {
    this.closed.emit();
  }

  private resetFormFromInput(): void {
    if (this.mode === 'edit' && this.schoolClass) {
      this.name = this.schoolClass.name;
      this.gradeId = this.schoolClass.gradeId;
      this.schoolId = this.schoolClass.schoolId;
      this.selectedStudentIds = new Set(this.schoolClass.studentIds);
    } else {
      this.name = '';
      this.gradeId = null;
      this.schoolId = null;
      this.selectedStudentIds = new Set<number>();
    }
    this.studentSearch = '';
    this.error = '';
  }

  private resetSelectedStudents(): void {
    this.selectedStudentIds =
      this.mode === 'edit' && this.schoolClass
        ? new Set(this.schoolClass.studentIds)
        : new Set<number>();
  }
}