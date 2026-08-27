export interface PreservedArray<T> {
  $id?: string;
  $values: T[];
}

export interface ExamApi {
  id: number;
  name: string | null;

  subjectId: number;
  subjectName: string | null;

  gradeId: number;
  gradeName: string | null;

  examDate: string | null;
  maxScore: number | null;
  status: 'Scheduled' | 'Completed' | 'Unscheduled';
}

export interface PagedExamsApiResponse {
  items: PreservedArray<ExamApi>;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Exam {
  id: number;
  title: string;

  subjectId: number;
  subject: string;

  gradeId: number;
  grade: string;

  examDate: Date | null;
  maxScore: number | null;

  status: 'Scheduled' | 'Completed' | 'Unscheduled';
}

export interface PagedExamsResult {
  exams: Exam[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ExamPayload {
  name: string;
  subjectId: number;
  gradeId: number;
  examDate: string | null;
  maxScore: number | null;
}

export function mapExam(api: ExamApi): Exam {
  const examDate = api.examDate
    ? new Date(api.examDate)
    : null;

  return {
    id: api.id,
    title: api.name ?? '(untitled exam)',

    subjectId: api.subjectId,
    subject: api.subjectName ?? '—',

    gradeId: api.gradeId,
    grade: api.gradeName ?? '—',

    examDate,
    maxScore: api.maxScore,

    status: api.status,
  };
}
