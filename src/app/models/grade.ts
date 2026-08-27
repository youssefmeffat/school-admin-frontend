export interface PreservedArray<T> {
  $id: string;
  $values: T[];
}

export interface GradeApi {
  id: number;
  name: string | null;
  number: number;
  description: string | null;
}

export interface PagedGradesApiResponse {
  items: PreservedArray<GradeApi>;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Grade {
  id: number;
  name: string;
  number: number;
  description: string | null;
}

export interface PagedGradesResult {
  grades: Grade[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export function mapGrade(api: GradeApi): Grade {
  return {
    id: api.id,
    name: api.name ?? `(Grade ${api.number})`,
    number: api.number,
    description: api.description,
  };
}
