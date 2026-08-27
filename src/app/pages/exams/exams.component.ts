import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';

import { forkJoin } from 'rxjs';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent }
  from '../../shared/page-header/page-header.component';

import {
  Exam,
} from '../../models/exam';

import {
  ExamParticipant,
  ExamService,
} from '../../services/exams.service';

import {
  ExamFormModalComponent,
} from './exam-form-modal.component';

import {
  ModalComponent,
} from '../../shared/modal/modal.component';

@Component({
  selector: 'app-exams',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    ExamFormModalComponent,
    ModalComponent,
  ],

  templateUrl: './exams.component.html',
  styleUrl: './exams.component.scss',
})
export class ExamsComponent
  implements OnInit, OnDestroy {

  exams: Exam[] = [];

  loading = true;
  error = '';

  searchTerm = '';

  pageSize = 20;
  currentPage = 1;
  totalCount = 0;
  totalPages = 0;
  hasPreviousPage = false;
  hasNextPage = false;

  statuses = [
    'All',
    'Scheduled',
    'Completed',
    'Unscheduled',
  ];

  activeStatus = 'All';

  showFormModal = false;

  modalMode:
    'create' | 'edit' = 'create';

  selectedExam:
    Exam | null = null;

  deletingId:
    number | null = null;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  // ---------------------------------------------------------
  // Results modal
  // ---------------------------------------------------------

  showResultsModal = false;

  selectedResultsExam:
    Exam | null = null;

  participants:
    ExamParticipant[] = [];

  participantSearch = '';

  filteredParticipants:
    ExamParticipant[] = [];

  resultsLoading = false;
  resultsError = '';

  savingResults = false;
  resultsSaveError = '';

  resultScores: {
    [studentId: number]: number | null;
  } = {};

  constructor(
    private examService: ExamService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.fetchExams(1);
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  // ---------------------------------------------------------
  // Exams
  // ---------------------------------------------------------

  fetchExams(
    page = this.currentPage,
  ): void {
    this.loading = true;
    this.error = '';

    this.examService
      .getAll(
        page,
        this.pageSize,
        this.searchTerm,
        this.activeStatus,
      )
      .subscribe({
        next: result => {
          this.exams = result.exams;
          this.currentPage = result.page;
          this.pageSize = result.pageSize;
          this.totalCount = result.totalCount;
          this.totalPages = result.totalPages;
          this.hasPreviousPage = result.hasPreviousPage;
          this.hasNextPage = result.hasNextPage;

          this.loading = false;
          this.cdr.detectChanges();
        },

        error: err => {
          console.error(
            'Failed to load exams:',
            err
          );

          this.error =
            'Could not load exams. Is the API running?';

          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      this.currentPage = 1;
      this.fetchExams(1);
    }, 300);
  }

  onStatusChange(
    status: string,
  ): void {
    if (this.activeStatus === status) {
      return;
    }

    this.activeStatus = status;
    this.currentPage = 1;
    this.fetchExams(1);
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.fetchExams(1);
  }

  goToPage(page: number): void {
    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.currentPage
    ) {
      return;
    }

    this.fetchExams(page);
  }

  previousPage(): void {
    if (this.hasPreviousPage) {
      this.goToPage(
        this.currentPage - 1,
      );
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.goToPage(
        this.currentPage + 1,
      );
    }
  }

  get pageStart(): number {
    if (this.totalCount === 0) {
      return 0;
    }

    return (
      (this.currentPage - 1) *
      this.pageSize
    ) + 1;
  }

  get pageEnd(): number {
    return Math.min(
      this.currentPage *
        this.pageSize,
      this.totalCount,
    );
  }

  get pageNumbers(): number[] {
    if (this.totalPages <= 5) {
      return Array.from(
        {
          length:
            this.totalPages,
        },
        (_, i) => i + 1,
      );
    }

    let start =
      Math.max(
        1,
        this.currentPage - 2,
      );

    const end =
      Math.min(
        this.totalPages,
        start + 4,
      );

    if (end - start < 4) {
      start =
        Math.max(
          1,
          end - 4,
        );
    }

    return Array.from(
      {
        length:
          end - start + 1,
      },
      (_, i) =>
        start + i,
    );
  }

  // Kept for the existing template structure.
  // Search/status filtering is now handled by the backend.
  get filtered(): Exam[] {
    return this.exams;
  }

  badgeClass(
    status: string,
  ): string {
    switch (status) {
      case 'Scheduled':
        return 'badge-blue';

      case 'Completed':
        return 'badge-green';

      default:
        return 'badge-gray';
    }
  }

  // ---------------------------------------------------------
  // Create / Edit
  // ---------------------------------------------------------

  openCreate(): void {
    this.modalMode = 'create';
    this.selectedExam = null;
    this.showFormModal = true;

    this.cdr.detectChanges();
  }

  openEdit(exam: Exam): void {
    this.modalMode = 'edit';
    this.selectedExam = exam;
    this.showFormModal = true;

    this.cdr.detectChanges();
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.selectedExam = null;

    this.cdr.detectChanges();
  }

  onSaved(): void {
    this.closeFormModal();
    this.fetchExams(
      this.currentPage,
    );
  }

  // ---------------------------------------------------------
  // Delete
  // ---------------------------------------------------------

  deleteExam(exam: Exam): void {
    if (
      this.deletingId !== null
    ) {
      return;
    }

    if (
      !window.confirm(
        `Delete "${exam.title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    this.deletingId = exam.id;
    this.error = '';

    this.examService
      .delete(exam.id)
      .subscribe({
        next: () => {
          const targetPage =
            this.exams.length === 1 &&
            this.currentPage > 1
              ? this.currentPage - 1
              : this.currentPage;

          this.deletingId = null;
          this.fetchExams(
            targetPage,
          );
        },

        error: err => {
          console.error(
            'Failed to delete exam:',
            err
          );

          this.error =
            'Could not delete exam. Please try again.';

          this.deletingId = null;

          this.cdr.detectChanges();
        },
      });
  }

  // ---------------------------------------------------------
  // Results
  // ---------------------------------------------------------

  openResults(exam: Exam): void {
    if (
      exam.status !== 'Completed'
    ) {
      return;
    }

    this.selectedResultsExam = exam;
    this.participants = [];
    this.filteredParticipants = [];
    this.participantSearch = '';
    this.resultsError = '';
    this.resultsSaveError = '';
    this.resultScores = {};
    this.resultsLoading = true;
    this.showResultsModal = true;

    this.cdr.detectChanges();

    this.examService
      .getParticipants(exam.id)
      .subscribe({
        next: participants => {
          this.participants = participants;
          this.filteredParticipants = participants;

          for (
            const participant
            of participants
          ) {
            this.resultScores[
              participant.studentId
            ] = participant.score;
          }

          this.resultsLoading = false;

          this.cdr.detectChanges();
        },

        error: err => {
          console.error(
            'Failed to load exam students:',
            err
          );

          this.resultsLoading = false;

          this.resultsError =
            'Could not load the students for this exam.';

          this.cdr.detectChanges();
        },
      });
  }

  onParticipantSearchChange(): void {
    const query =
      this.participantSearch
        .trim()
        .toLowerCase();

    if (!query) {
      this.filteredParticipants =
        this.participants;

      this.cdr.detectChanges();

      return;
    }

    this.filteredParticipants =
      this.participants.filter(
        participant => {

          const studentName =
            (
              participant.studentName ??
              ''
            ).toLowerCase();

          const studentId =
            String(
              participant.studentId
            );

          return (
            studentName.includes(query) ||
            studentId.includes(query)
          );
        }
      );

    this.cdr.detectChanges();
  }

  // ---------------------------------------------------------
  // Save results
  // ---------------------------------------------------------

  saveResults(): void {
    if (
      !this.selectedResultsExam ||
      this.savingResults
    ) {
      return;
    }

    const exam =
      this.selectedResultsExam;

    const maxScore =
      exam.maxScore;

    if (
      maxScore === null
    ) {
      this.resultsSaveError =
        'This exam does not have a maximum score.';

      return;
    }

    for (
      const participant
      of this.participants
    ) {
      const score =
        this.resultScores[
          participant.studentId
        ];

      if (
        score === null ||
        score === undefined
      ) {
        continue;
      }

      if (
        score < 0 ||
        score > maxScore
      ) {
        this.resultsSaveError =
          `Scores must be between 0 and ${maxScore}.`;

        return;
      }
    }

    this.savingResults = true;
    this.resultsSaveError = '';

    const requests =
      this.participants
        .map(participant => {

          const score =
            this.resultScores[
              participant.studentId
            ];

          if (
            score === null ||
            score === undefined
          ) {
            return null;
          }

          return this.examService.saveScore(
            participant.studentId,
            exam.id,
            score
          );
        })
        .filter(
          request => request !== null
        );

    if (
      requests.length === 0
    ) {
      this.savingResults = false;
      this.closeResults();

      return;
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.savingResults = false;

        this.closeResults();

        this.cdr.detectChanges();
      },

      error: err => {
        console.error(
          'Failed to save exam results:',
          err
        );

        this.savingResults = false;

        this.resultsSaveError =
          'Could not save the results. Please try again.';

        this.cdr.detectChanges();
      },
    });
  }

  // ---------------------------------------------------------
  // Close Results
  // ---------------------------------------------------------

  closeResults(): void {
    this.showResultsModal = false;
    this.selectedResultsExam = null;
    this.participants = [];
    this.filteredParticipants = [];
    this.participantSearch = '';
    this.resultScores = {};
    this.resultsError = '';
    this.resultsSaveError = '';

    this.cdr.detectChanges();
  }
}