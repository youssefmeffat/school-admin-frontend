export interface PreservedArray<T> {
  $id: string;
  $values: T[];
}

export interface ClassStudentApi {
  id: number;
  fullName: string | null;
}

export interface ClassApi {
  id: number;
  name: string | null;
  gradeId: number;
  schoolId: number | null;
  students: PreservedArray<ClassStudentApi>;
}

export interface PagedClassesApiResponse {
  items: PreservedArray<ClassApi>;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface SchoolClass {
  id: number;
  name: string;
  gradeId: number;
  schoolId: number | null;
  studentIds: number[];
  studentNames: string[];
  studentCount: number;
}

export interface PagedClassesResult {
  classes: SchoolClass[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ClassPayload {
  name: string;
  gradeId: number;
  schoolId: number | null;
}

export interface UpdateClassStudentsPayload {
  studentIds: number[];
}

export function mapSchoolClass(api: ClassApi): SchoolClass {
  const students = api.students?.$values ?? [];
  const sorted = [...students].sort((a, b) =>
    (a.fullName ?? '').localeCompare(b.fullName ?? '')
  );

  return {
    id: api.id,
    name: api.name ?? '(unnamed class)',
    gradeId: api.gradeId,
    schoolId: api.schoolId,
    studentIds: sorted.map(s => s.id),
    studentNames: sorted.map(s => s.fullName ?? '(no name)'),
    studentCount: sorted.length,
  };
}
