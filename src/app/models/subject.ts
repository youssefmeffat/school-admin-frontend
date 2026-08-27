export interface PreservedArray<T> {
  $id: string;
  $values: T[];
}

export interface SubjectApi {
  id: number;
  name: string | null;
}

export interface PagedSubjectsApiResponse {
  items: PreservedArray<SubjectApi>;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Subject {
  id: number;
  name: string;
}

export function mapSubject(api: SubjectApi): Subject {
  return {
    id: api.id,
    name: api.name ?? '(unnamed subject)',
  };
}
