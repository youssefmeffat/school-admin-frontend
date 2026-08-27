// Mirrors Api.DTOs.TeacherDto — note this DTO only exposes Id, FullName,
// and Email. Teacher.cs also has Code, Phone, and HireDate, but
// TeachersController's GetAll/Get never select them, so they can't be
// shown here yet.

export interface PreservedArray<T> {
  $id: string;
  $values: T[];
}

export interface TeacherApi {
  id: number;
  fullName: string | null;
  email: string | null;
}

export interface PagedTeachersApiResponse {
  items: PreservedArray<TeacherApi>;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Teacher {
  id: number;
  fullName: string;
  email: string | null;
}

export interface PagedTeachersResult {
  teachers: Teacher[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export function mapTeacher(api: TeacherApi): Teacher {
  return {
    id: api.id,
    fullName: api.fullName ?? '(no name)',
    email: api.email,
  };
}

// Matches Api.DTOs.TeacherCreateDto — FullName is required server-side.
// Code is accepted on create but never comes back in TeacherDto afterward.
export interface TeacherPayload {
  fullName: string;
  email: string | null;
  code: string | null;
}
