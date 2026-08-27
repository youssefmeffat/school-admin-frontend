// Mirrors the JSON shape StudentsController now returns:
// a plain array of camelCase objects (PropertyNamingPolicy.CamelCase,
// no ReferenceHandler.Preserve wrapper).

export interface ClassSummaryApi {
  id: number;
  name: string;
}

export interface StudentApi {
  id: number;
  fullName: string | null;
  code: string | null;
  dateOfBirth: string | null; // ISO date string
  enrollDate: string | null;  // ISO date string
  classId: number | null;
  class: ClassSummaryApi | null;
}

// ReferenceHandler.Preserve is still on in Program.cs, so every response
// — including plain arrays — is wrapped like this instead of being bare.
export interface PreservedArray<T> {
  $id: string;
  $values: T[];
}

// Clean shape used inside the Angular app / templates.
export interface Student {
  id: number;
  fullName: string;
  code: string;
  dateOfBirth: Date | null;
  enrollDate: Date | null;
  classId: number | null;
  className: string | null;
}

export function mapStudent(api: StudentApi): Student {
  return {
    id: api.id,
    fullName: api.fullName ?? '(no name)',
    code: api.code ?? '—',
    dateOfBirth: api.dateOfBirth ? new Date(api.dateOfBirth) : null,
    enrollDate: api.enrollDate ? new Date(api.enrollDate) : null,
    classId: api.classId,
    className: api.class?.name ?? null,
  };
}

// Shape sent on create/update via [FromBody] Student — camelCase in, the
// model binder maps it back onto the C# PascalCase properties automatically.
export interface StudentPayload {
  fullName: string;
  code: string;
  dateOfBirth: string | null;
  enrollDate: string | null;
  classId: number | null;
}
