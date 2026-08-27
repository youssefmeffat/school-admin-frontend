export interface PreservedArray<T> {
  $id: string;
  $values: T[];
}

export interface TeachingAssignment {
  id: number;
  teacherId: number;
  teacherName: string;
  subjectId: number;
  subjectName: string;
  classId: number;
  className: string;
  gradeId: number;
  gradeName: string;
}

export interface TeachingAssignmentPayload {
  teacherId: number;
  subjectId: number;
  classId: number;
}
